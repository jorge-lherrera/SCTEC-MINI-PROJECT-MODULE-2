import { UserRole } from '../entities/user-role.enum';

export interface AuthenticatedUser {
  id: number;
  roles: UserRole[];
}
