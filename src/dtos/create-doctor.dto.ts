import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimString } from '../utils/string.util';
import { UserAccountDto } from './user-account.dto';

export class CreateDoctorDto extends UserAccountDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  crm: string;
}
