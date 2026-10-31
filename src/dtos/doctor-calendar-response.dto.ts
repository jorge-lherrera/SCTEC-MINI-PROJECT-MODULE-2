import { Appointment } from '../entities/appointment.entity';
import { WorkShift } from '../entities/work-shift.entity';
import { AppointmentResponseDto } from './appointment-response.dto';
import { WorkScheduleResponseDto } from './work-schedule-response.dto';

export class DoctorCalendarResponseDto {
  public readonly workSchedule: WorkScheduleResponseDto;
  public readonly appointments: AppointmentResponseDto[];

  constructor(shifts: WorkShift[], appointments: Appointment[]) {
    this.workSchedule = new WorkScheduleResponseDto(shifts);
    this.appointments = appointments.map(
      (appointment) => new AppointmentResponseDto(appointment),
    );
  }
}
