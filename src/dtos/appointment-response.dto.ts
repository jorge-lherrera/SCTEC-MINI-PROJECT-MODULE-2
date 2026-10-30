import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../entities/appointment-status.enum';

export class AppointmentResponseDto {
  public readonly id: number;
  public readonly doctorId: number;
  public readonly patientId: number;
  public readonly startsAt: Date;
  public readonly endsAt: Date;
  public readonly status: AppointmentStatus;

  constructor(appointment: Appointment) {
    this.id = appointment.id;
    this.doctorId = appointment.doctorId;
    this.patientId = appointment.patientId;
    this.startsAt = appointment.startsAt;
    this.endsAt = appointment.endsAt;
    this.status = appointment.status;
  }
}
