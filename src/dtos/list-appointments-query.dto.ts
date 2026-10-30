import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { CALENDAR_DATE_PATTERN } from '../utils/clinic-time.util';
import { MAX_IDENTITY_VALUE } from '../utils/identity.util';
import { PaginationQueryDto } from './pagination-query.dto';

const CALENDAR_DATE_MESSAGE = '$property deve estar no formato YYYY-MM-DD';

export class ListAppointmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_IDENTITY_VALUE)
  doctorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_IDENTITY_VALUE)
  patientId?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @Matches(CALENDAR_DATE_PATTERN, { message: CALENDAR_DATE_MESSAGE })
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(CALENDAR_DATE_PATTERN, { message: CALENDAR_DATE_MESSAGE })
  @IsISO8601({ strict: true })
  to?: string;
}
