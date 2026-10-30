import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export const DOCTOR_CRM_UNIQUE_CONSTRAINT = 'UQ_doctors_crm';

@Entity('doctors')
@Unique(DOCTOR_CRM_UNIQUE_CONSTRAINT, ['crm'])
export class Doctor {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS',
    primaryKeyConstraintName: 'PK_doctors',
  })
  id: number;

  @Column({ type: 'varchar', length: 30 })
  crm: string;

  @OneToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_doctors_user' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
