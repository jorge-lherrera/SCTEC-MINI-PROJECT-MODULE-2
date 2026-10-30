import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsCalendarDate } from '../decorators/is-calendar-date.decorator';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { MAX_IDENTITY_VALUE } from '../utils/identity.util';
import { PaginationQueryDto } from './pagination-query.dto';

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
  @IsCalendarDate()
  from?: string;

  @IsOptional()
  @IsCalendarDate()
  to?: string;
}
