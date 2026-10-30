import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CLOCK_TIME_PATTERN } from '../utils/clock-time.util';

const CLOCK_TIME_MESSAGE = '$property deve estar no formato HH:MM (00:00 a 23:59)';
const MINUTES_PER_DAY = 1440;
const MAX_SHIFTS = 100;

export class WorkShiftDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekDay: number;

  @IsString()
  @Matches(CLOCK_TIME_PATTERN, { message: CLOCK_TIME_MESSAGE })
  startTime: string;

  @IsString()
  @Matches(CLOCK_TIME_PATTERN, { message: CLOCK_TIME_MESSAGE })
  endTime: string;

  @IsInt()
  @Min(1)
  @Max(MINUTES_PER_DAY)
  slotDurationMinutes: number;
}

export class WorkScheduleDto {
  @IsArray()
  @ArrayMaxSize(MAX_SHIFTS)
  @ValidateNested({ each: true })
  @Type(() => WorkShiftDto)
  shifts: WorkShiftDto[];
}
