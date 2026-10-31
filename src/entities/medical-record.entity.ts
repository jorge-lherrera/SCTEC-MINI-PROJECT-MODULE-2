import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity('medical_records')
@Index('IDX_medical_records_patient_created_at', ['patientId', 'createdAt'])
@Check('CHK_medical_records_text', 'length(btrim("text")) > 0')
export class MedicalRecord {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS',
    primaryKeyConstraintName: 'PK_medical_records',
  })
  id: number;

  @Column({ name: 'patient_id', type: 'integer' })
  patientId: number;

  @ManyToOne(() => Patient, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'patient_id',
    foreignKeyConstraintName: 'FK_medical_records_patient',
  })
  patient: Patient;

  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId: number;

  @ManyToOne(() => Doctor, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'doctor_id',
    foreignKeyConstraintName: 'FK_medical_records_doctor',
  })
  doctor: Doctor;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
