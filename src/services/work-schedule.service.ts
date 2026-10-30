import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../database/transaction-runner';
import { WorkScheduleResponseDto } from '../dtos/work-schedule-response.dto';
import { WorkScheduleDto, WorkShiftDto } from '../dtos/work-schedule.dto';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { DoctorRepository } from '../repositories/doctor.repository';
import { WorkShiftRepository } from '../repositories/work-shift.repository';
import { clockTimeToMinutes } from '../utils/clock-time.util';
import { Period, periodsOverlap } from '../utils/period.util';

interface ShiftPeriod extends Period {
  shift: WorkShiftDto;
}

@Injectable()
export class WorkScheduleService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly workShiftRepository: WorkShiftRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  public async replace(
    doctorId: number,
    data: WorkScheduleDto,
  ): Promise<WorkScheduleResponseDto> {
    this.assertValidShifts(data.shifts);

    const shifts = await this.transactionRunner.run(async (manager) => {
      if ((await this.doctorRepository.lockById(doctorId, manager)) === null) {
        throw this.doctorNotFound();
      }

      return this.workShiftRepository.replaceForDoctor(
        doctorId,
        data.shifts.map((shift) => ({
          weekDay: shift.weekDay,
          startTime: shift.startTime,
          endTime: shift.endTime,
          slotDurationMinutes: shift.slotDurationMinutes,
        })),
        manager,
      );
    });

    return new WorkScheduleResponseDto(shifts);
  }

  public async find(doctorId: number): Promise<WorkScheduleResponseDto> {
    if (!(await this.doctorRepository.existsById(doctorId))) {
      throw this.doctorNotFound();
    }

    return new WorkScheduleResponseDto(
      await this.workShiftRepository.findByDoctorId(doctorId),
    );
  }

  private assertValidShifts(shifts: WorkShiftDto[]): void {
    const periods: ShiftPeriod[] = shifts.map((shift) => ({
      shift,
      start: clockTimeToMinutes(shift.startTime),
      end: clockTimeToMinutes(shift.endTime),
    }));

    const reversed = periods.find((period) => period.start >= period.end);

    if (reversed !== undefined) {
      throw new DomainError(
        ErrorCode.DADOS_INVALIDOS,
        `O turno ${this.describe(reversed.shift)} deve começar antes de terminar.`,
      );
    }

    periods.forEach((period, index) => {
      const overlapping = periods
        .slice(index + 1)
        .find(
          (other) =>
            other.shift.weekDay === period.shift.weekDay &&
            periodsOverlap(period, other),
        );

      if (overlapping !== undefined) {
        throw new DomainError(
          ErrorCode.DADOS_INVALIDOS,
          `Os turnos ${this.describe(period.shift)} e ${this.describe(overlapping.shift)} se sobrepõem.`,
        );
      }
    });
  }

  private describe(shift: WorkShiftDto): string {
    return `${shift.startTime}-${shift.endTime} do dia ${shift.weekDay}`;
  }

  private doctorNotFound(): DomainError {
    return new DomainError(
      ErrorCode.RECURSO_NAO_ENCONTRADO,
      'Médico não encontrado.',
    );
  }
}
