import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Exclusion,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentStatus } from './appointment-status.enum';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

export const APPOINTMENT_DOCTOR_PERIOD_EXCLUSION =
  'EXC_appointments_doctor_period';
export const APPOINTMENT_PATIENT_PERIOD_EXCLUSION =
  'EXC_appointments_patient_period';

@Entity('appointments')
@Index('IDX_appointments_doctor_starts_at', ['doctorId', 'startsAt'])
@Index('IDX_appointments_patient_starts_at', ['patientId', 'startsAt'])
@Check('CHK_appointments_period', '"starts_at" < "ends_at"')
@Exclusion(
  APPOINTMENT_DOCTOR_PERIOD_EXCLUSION,
  `USING gist ("doctor_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&) WHERE ("status" <> 'cancelled')`,
)
@Exclusion(
  APPOINTMENT_PATIENT_PERIOD_EXCLUSION,
  `USING gist ("patient_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&) WHERE ("status" <> 'cancelled')`,
)
export class Appointment {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS',
    primaryKeyConstraintName: 'PK_appointments',
  })
  id: number;

  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId: number;

  @ManyToOne(() => Doctor, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'doctor_id',
    foreignKeyConstraintName: 'FK_appointments_doctor',
  })
  doctor: Doctor;

  @Column({ name: 'patient_id', type: 'integer' })
  patientId: number;

  @ManyToOne(() => Patient, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'patient_id',
    foreignKeyConstraintName: 'FK_appointments_patient',
  })
  patient: Patient;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    enumName: 'appointment_status',
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
