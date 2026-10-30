import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { trimString } from '../utils/string.util';

export class CreatePatientDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'cpf deve ter exatamente 11 dígitos numéricos',
  })
  cpf: string;
}
