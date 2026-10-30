import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../database/transaction-runner';
import { AppointmentResponseDto } from '../dtos/appointment-response.dto';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { ListAppointmentsQueryDto } from '../dtos/list-appointments-query.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { UpdateAppointmentStatusDto } from '../dtos/update-appointment-status.dto';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { UserRole } from '../entities/user-role.enum';
import { WorkShift } from '../entities/work-shift.entity';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import {
  AppointmentFilter,
  AppointmentRepository,
} from '../repositories/appointment.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { WorkShiftRepository } from '../repositories/work-shift.repository';
import { AuthenticatedUser } from '../types/authenticated-user.interface';
import { startOfClinicDay, toClinicLocalTime } from '../utils/clinic-time.util';
import { clockTimeToMinutes } from '../utils/clock-time.util';
import { toPageWindow } from '../utils/pagination.util';

const MILLISECONDS_PER_MINUTE = 60_000;

const STATUS_TRANSITIONS: Readonly<
  Record<AppointmentStatus, Partial<Record<AppointmentStatus, UserRole[]>>>
> = {
  [AppointmentStatus.SCHEDULED]: {
    [AppointmentStatus.IN_PROGRESS]: [UserRole.DOCTOR, UserRole.ADMIN],
    [AppointmentStatus.CANCELLED]: [
      UserRole.ADMIN,
      UserRole.SECRETARY,
      UserRole.DOCTOR,
    ],
  },
  [AppointmentStatus.IN_PROGRESS]: {
    [AppointmentStatus.DONE]: [UserRole.DOCTOR, UserRole.ADMIN],
    [AppointmentStatus.CANCELLED]: [UserRole.ADMIN, UserRole.DOCTOR],
  },
  [AppointmentStatus.DONE]: {},
  [AppointmentStatus.CANCELLED]: {},
};

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly patientRepository: PatientRepository,
    private readonly workShiftRepository: WorkShiftRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  public async create(
    data: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const startsAt = new Date(data.startsAt);

    const appointment = await this.transactionRunner.run(async (manager) => {
      if ((await this.doctorRepository.lockById(data.doctorId, manager)) === null) {
        throw this.notFound('Médico não encontrado.');
      }

      if (
        (await this.patientRepository.lockById(data.patientId, manager)) === null
      ) {
        throw this.notFound('Paciente não encontrado.');
      }

      const shifts = await this.workShiftRepository.findByDoctorId(
        data.doctorId,
        manager,
      );
      const period = { startsAt, endsAt: this.resolveEndsAt(startsAt, shifts) };

      if (
        await this.appointmentRepository.hasActiveOverlapForDoctor(
          data.doctorId,
          period,
          manager,
        )
      ) {
        throw new DomainError(
          ErrorCode.HORARIO_INDISPONIVEL,
          'O médico já tem consulta nesse horário.',
        );
      }

      if (
        await this.appointmentRepository.hasActiveOverlapForPatient(
          data.patientId,
          period,
          manager,
        )
      ) {
        throw new DomainError(
          ErrorCode.PACIENTE_INDISPONIVEL,
          'O paciente já tem consulta nesse horário.',
        );
      }

      return this.appointmentRepository.create(
        {
          doctorId: data.doctorId,
          patientId: data.patientId,
          ...period,
          status: AppointmentStatus.SCHEDULED,
        },
        manager,
      );
    });

    return new AppointmentResponseDto(appointment);
  }

  public async findPage(
    query: ListAppointmentsQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    if (
      query.from !== undefined &&
      query.to !== undefined &&
      query.from > query.to
    ) {
      throw new DomainError(
        ErrorCode.DADOS_INVALIDOS,
        'A data inicial não pode ser posterior à data final.',
      );
    }

    const filter: AppointmentFilter = {
      doctorId: query.doctorId,
      patientId: query.patientId,
      status: query.status,
      startsFrom:
        query.from === undefined ? undefined : startOfClinicDay(query.from),
      startsBefore:
        query.to === undefined ? undefined : startOfClinicDay(query.to, 1),
    };

    if (this.isRestrictedToOwnAppointments(user)) {
      const ownDoctorId = await this.findOwnDoctorId(user);

      if (
        ownDoctorId === null ||
        (query.doctorId !== undefined && query.doctorId !== ownDoctorId)
      ) {
        return new PaginatedResponseDto([], 0, query);
      }

      filter.doctorId = ownDoctorId;
    }

    const [appointments, total] = await this.appointmentRepository.findPage(
      filter,
      toPageWindow(query),
    );

    return new PaginatedResponseDto(
      appointments.map((appointment) => new AppointmentResponseDto(appointment)),
      total,
      query,
    );
  }

  public async findById(
    id: number,
    user: AuthenticatedUser,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findById(id);

    if (appointment === null) {
      throw this.notFound('Agendamento não encontrado.');
    }

    await this.requireRolesOnAppointment(appointment, user);

    return new AppointmentResponseDto(appointment);
  }

  public async changeStatus(
    id: number,
    data: UpdateAppointmentStatusDto,
    user: AuthenticatedUser,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.transactionRunner.run(async (manager) => {
      const current = await this.appointmentRepository.lockById(id, manager);

      if (current === null) {
        throw this.notFound('Agendamento não encontrado.');
      }

      const actingRoles = await this.requireRolesOnAppointment(current, user);
      const allowedRoles = STATUS_TRANSITIONS[current.status][data.status];

      if (allowedRoles === undefined) {
        throw new DomainError(
          ErrorCode.TRANSICAO_INVALIDA,
          `O agendamento não pode passar de ${current.status} para ${data.status}.`,
        );
      }

      if (!allowedRoles.some((role) => actingRoles.includes(role))) {
        throw new DomainError(
          ErrorCode.ACESSO_NEGADO,
          'Seu perfil não pode fazer essa mudança de status.',
        );
      }

      current.status = data.status;

      return this.appointmentRepository.save(current, manager);
    });

    return new AppointmentResponseDto(appointment);
  }

  private isRestrictedToOwnAppointments(user: AuthenticatedUser): boolean {
    return user.roles.every((role) => role === UserRole.DOCTOR);
  }

  private async requireRolesOnAppointment(
    appointment: Appointment,
    user: AuthenticatedUser,
  ): Promise<UserRole[]> {
    const roles: UserRole[] = user.roles.filter(
      (role) => role !== UserRole.DOCTOR,
    );

    if (
      user.roles.includes(UserRole.DOCTOR) &&
      (await this.findOwnDoctorId(user)) === appointment.doctorId
    ) {
      roles.push(UserRole.DOCTOR);
    }

    if (roles.length === 0) {
      throw new DomainError(
        ErrorCode.ACESSO_NEGADO,
        'O agendamento pertence a outro médico.',
      );
    }

    return roles;
  }

  private async findOwnDoctorId(
    user: AuthenticatedUser,
  ): Promise<number | null> {
    const doctor = await this.doctorRepository.findByUserId(user.id);

    return doctor?.id ?? null;
  }

  private resolveEndsAt(startsAt: Date, shifts: WorkShift[]): Date {
    const { weekDay, minuteOfDay } = toClinicLocalTime(startsAt);
    const shift = shifts.find(
      (candidate) =>
        candidate.weekDay === weekDay &&
        clockTimeToMinutes(candidate.startTime) <= minuteOfDay &&
        minuteOfDay < clockTimeToMinutes(candidate.endTime),
    );

    if (shift === undefined) {
      throw this.outsideSchedule(
        'O horário não está dentro de nenhum turno da escala do médico.',
      );
    }

    const minutesSinceShiftStart =
      minuteOfDay - clockTimeToMinutes(shift.startTime);

    if (
      startsAt.getTime() % MILLISECONDS_PER_MINUTE !== 0 ||
      minutesSinceShiftStart % shift.slotDurationMinutes !== 0
    ) {
      throw this.outsideSchedule(
        `O horário não está alinhado à grade de ${shift.slotDurationMinutes} minutos do turno.`,
      );
    }

    if (
      minuteOfDay + shift.slotDurationMinutes >
      clockTimeToMinutes(shift.endTime)
    ) {
      throw this.outsideSchedule('A consulta não cabe antes do fim do turno.');
    }

    return new Date(
      startsAt.getTime() + shift.slotDurationMinutes * MILLISECONDS_PER_MINUTE,
    );
  }

  private outsideSchedule(message: string): DomainError {
    return new DomainError(ErrorCode.HORARIO_FORA_DA_ESCALA, message);
  }

  private notFound(message: string): DomainError {
    return new DomainError(ErrorCode.RECURSO_NAO_ENCONTRADO, message);
  }
}
