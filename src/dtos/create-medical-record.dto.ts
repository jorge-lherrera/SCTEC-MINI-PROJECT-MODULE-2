import { Transform } from 'class-transformer';
import { Allow, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimString } from '../utils/string.util';

export const MEDICAL_RECORD_TEXT_MAX_LENGTH = 10_000;

export class CreateMedicalRecordDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(MEDICAL_RECORD_TEXT_MAX_LENGTH)
  text: string;

  @Allow()
  doctorId?: unknown;
}
