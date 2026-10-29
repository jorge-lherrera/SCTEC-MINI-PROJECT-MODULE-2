import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserRole } from './user-role.enum';

export const USER_EMAIL_UNIQUE_CONSTRAINT = 'UQ_users_email';

@Entity('users')
@Unique(USER_EMAIL_UNIQUE_CONSTRAINT, ['email'])
@Check('CHK_users_roles_not_empty', 'cardinality("roles") > 0')
export class User {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS',
    primaryKeyConstraintName: 'PK_users',
  })
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', array: true })
  roles: UserRole[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
