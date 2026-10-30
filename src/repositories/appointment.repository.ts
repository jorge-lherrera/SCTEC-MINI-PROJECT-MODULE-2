import { Injectable } from '@nestjs/common';
import { EntityManager, LessThan, MoreThan, Not } from 'typeorm';
import {
  APPOINTMENT_DOCTOR_PERIOD_EXCLUSION,
  APPOINTMENT_PATIENT_PERIOD_EXCLUSION,
  Appointment,
} from '../entities/appointment.entity';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { isExclusionViolation } from '../utils/database-error.util';

export type CreatableAppointment = Pick<
  Appointment,
  'doctorId' | 'patientId' | 'startsAt' | 'endsAt' | 'status'
>;

export interface AppointmentPeriod {
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class AppointmentRepository {
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

  private activeOverlapWith(period: AppointmentPeriod) {
    return {
      status: Not(AppointmentStatus.CANCELLED),
      startsAt: LessThan(period.endsAt),
      endsAt: MoreThan(period.startsAt),
    };
  }
}
