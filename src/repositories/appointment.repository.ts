import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  EntityManager,
  FindOperator,
  FindOptionsWhere,
  In,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import {
  APPOINTMENT_DOCTOR_PERIOD_EXCLUSION,
  APPOINTMENT_PATIENT_PERIOD_EXCLUSION,
  Appointment,
} from '../entities/appointment.entity';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { isExclusionViolation } from '../utils/database-error.util';
import { PageWindow } from '../utils/pagination.util';

export type CreatableAppointment = Pick<
  Appointment,
  'doctorId' | 'patientId' | 'startsAt' | 'endsAt' | 'status'
>;

export interface AppointmentPeriod {
  startsAt: Date;
  endsAt: Date;
}

export interface AppointmentFilter {
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus;
  startsFrom?: Date;
  startsBefore?: Date;
}

@Injectable()
export class AppointmentRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repository: Repository<Appointment>,
  ) {}

  public async findById(id: number): Promise<Appointment | null> {
    return this.repository.findOneBy({ id });
  }

  public async lockById(
    id: number,
    manager: EntityManager,
  ): Promise<Appointment | null> {
    return manager.getRepository(Appointment).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  public async save(
    appointment: Appointment,
    manager: EntityManager,
  ): Promise<Appointment> {
    return manager.getRepository(Appointment).save(appointment);
  }

  public async findPage(
    filter: AppointmentFilter,
    window: PageWindow,
  ): Promise<[Appointment[], number]> {
    return this.repository.findAndCount({
      where: this.toWhere(filter),
      order: { startsAt: 'ASC', id: 'ASC' },
      skip: window.skip,
      take: window.take,
    });
  }

  public async findActiveForDoctorInPeriod(
    doctorId: number,
    period: AppointmentPeriod,
  ): Promise<Appointment[]> {
    return this.repository.find({
      where: { doctorId, ...this.activeOverlapWith(period) },
      order: { startsAt: 'ASC', id: 'ASC' },
    });
  }

  public async create(
    data: CreatableAppointment,
    manager: EntityManager,
  ): Promise<Appointment> {
    const repository = manager.getRepository(Appointment);

    try {
      return await repository.save(repository.create(data));
    } catch (error) {
      if (isExclusionViolation(error, APPOINTMENT_DOCTOR_PERIOD_EXCLUSION)) {
        throw new DomainError(
          ErrorCode.HORARIO_INDISPONIVEL,
          'O médico já tem consulta nesse horário.',
        );
      }

      if (isExclusionViolation(error, APPOINTMENT_PATIENT_PERIOD_EXCLUSION)) {
        throw new DomainError(
          ErrorCode.PACIENTE_INDISPONIVEL,
          'O paciente já tem consulta nesse horário.',
        );
      }

      throw error;
    }
  }

  public async existsForDoctorAndPatient(
    doctorId: number,
    patientId: number,
    statuses: AppointmentStatus[],
  ): Promise<boolean> {
    return this.repository.existsBy({
      doctorId,
      patientId,
      status: In(statuses),
    });
  }

  public async hasActiveOverlapForDoctor(
    doctorId: number,
    period: AppointmentPeriod,
    manager: EntityManager,
  ): Promise<boolean> {
    return manager
      .getRepository(Appointment)
      .existsBy({ doctorId, ...this.activeOverlapWith(period) });
  }

  public async hasActiveOverlapForPatient(
    patientId: number,
    period: AppointmentPeriod,
    manager: EntityManager,
  ): Promise<boolean> {
    return manager
      .getRepository(Appointment)
      .existsBy({ patientId, ...this.activeOverlapWith(period) });
  }

  private toWhere(filter: AppointmentFilter): FindOptionsWhere<Appointment> {
    const where: FindOptionsWhere<Appointment> = {};
    const startsAt = this.toStartsAtRange(filter);

    if (filter.doctorId !== undefined) {
      where.doctorId = filter.doctorId;
    }

    if (filter.patientId !== undefined) {
      where.patientId = filter.patientId;
    }

    if (filter.status !== undefined) {
      where.status = filter.status;
    }

    if (startsAt !== undefined) {
      where.startsAt = startsAt;
    }

    return where;
  }

  private toStartsAtRange(
    filter: AppointmentFilter,
  ): FindOperator<Date> | undefined {
    const { startsFrom, startsBefore } = filter;

    if (startsFrom !== undefined && startsBefore !== undefined) {
      return And(MoreThanOrEqual(startsFrom), LessThan(startsBefore));
    }

    if (startsFrom !== undefined) {
      return MoreThanOrEqual(startsFrom);
    }

    return startsBefore === undefined ? undefined : LessThan(startsBefore);
  }

  private activeOverlapWith(period: AppointmentPeriod) {
    return {
      status: Not(AppointmentStatus.CANCELLED),
      startsAt: LessThan(period.endsAt),
      endsAt: MoreThan(period.startsAt),
    };
  }
}
