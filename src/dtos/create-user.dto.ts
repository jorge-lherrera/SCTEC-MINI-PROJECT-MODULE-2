import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user-role.enum';
import { UserAccountDto } from './user-account.dto';

export class CreateUserDto extends UserAccountDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
