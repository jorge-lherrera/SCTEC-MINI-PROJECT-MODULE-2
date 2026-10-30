import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { trimString } from '../utils/string.util';

export class UpdatePatientDto {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;
}
