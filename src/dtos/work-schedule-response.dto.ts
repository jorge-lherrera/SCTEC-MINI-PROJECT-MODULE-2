import { WorkShift } from '../entities/work-shift.entity';
import { toClockTime } from '../utils/clock-time.util';

export class WorkShiftResponseDto {
  public readonly weekDay: number;
  public readonly startTime: string;
  public readonly endTime: string;
  public readonly slotDurationMinutes: number;

  constructor(shift: WorkShift) {
    this.weekDay = shift.weekDay;
    this.startTime = toClockTime(shift.startTime);
    this.endTime = toClockTime(shift.endTime);
    this.slotDurationMinutes = shift.slotDurationMinutes;
  }
}

export class WorkScheduleResponseDto {
  public readonly shifts: WorkShiftResponseDto[];

  constructor(shifts: WorkShift[]) {
    this.shifts = shifts
      .map((shift) => new WorkShiftResponseDto(shift))
      .sort(
        (first, second) =>
          first.weekDay - second.weekDay ||
          first.startTime.localeCompare(second.startTime),
      );
  }
}
