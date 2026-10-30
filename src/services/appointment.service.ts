import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../database/transaction-runner';
import { AppointmentResponseDto } from '../dtos/appointment-response.dto';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { WorkShift } from '../entities/work-shift.entity';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { WorkShiftRepository } from '../repositories/work-shift.repository';
import { toClinicLocalTime } from '../utils/clinic-time.util';
import { clockTimeToMinutes } from '../utils/clock-time.util';

const MILLISECONDS_PER_MINUTE = 60_000;

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
