import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment-status.enum';

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
