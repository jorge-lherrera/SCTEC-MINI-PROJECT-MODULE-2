import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('work_shifts')
@Index('IDX_work_shifts_doctor_week_day', ['doctorId', 'weekDay'])
@Check('CHK_work_shifts_week_day', '"week_day" BETWEEN 0 AND 6')
@Check('CHK_work_shifts_time_order', '"start_time" < "end_time"')
@Check('CHK_work_shifts_slot_duration', '"slot_duration_minutes" > 0')
export class WorkShift {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS',
    primaryKeyConstraintName: 'PK_work_shifts',
  })
  id: number;

  @Column({ name: 'doctor_id', type: 'integer' })
  doctorId: number;

  @ManyToOne(() => Doctor, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'doctor_id',
    foreignKeyConstraintName: 'FK_work_shifts_doctor',
  })
  doctor: Doctor;

  @Column({ name: 'week_day', type: 'smallint' })
  weekDay: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'slot_duration_minutes', type: 'smallint' })
  slotDurationMinutes: number;
}
