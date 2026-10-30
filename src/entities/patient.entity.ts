import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const PATIENT_CPF_UNIQUE_INDEX = 'UQ_patients_cpf';

@Entity('patients')
@Index(PATIENT_CPF_UNIQUE_INDEX, ['cpf'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Check('CHK_patients_cpf_format', `"cpf" ~ '^[0-9]{11}$'`)
export class Patient {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS',
    primaryKeyConstraintName: 'PK_patients',
  })
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'char', length: 11 })
  cpf: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
