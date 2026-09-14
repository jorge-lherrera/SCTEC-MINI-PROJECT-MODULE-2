import { UserRole } from '../entities/user-role.enum';

export class AdminPingResponseDto {
  public readonly status: string;
  public readonly role: UserRole;
  public readonly checkedAt: Date;

  constructor(role: UserRole) {
    this.status = 'ok';
    this.role = role;
    this.checkedAt = new Date();
  }
}
