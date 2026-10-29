import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';

export class UserResponseDto {
  public readonly id: number;
  public readonly name: string;
  public readonly email: string;
  public readonly roles: UserRole[];

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.roles = user.roles;
  }
}
