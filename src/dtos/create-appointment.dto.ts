import { IsInt, IsISO8601, IsString, Matches, Max, Min } from 'class-validator';
import { MAX_IDENTITY_VALUE } from '../utils/identity.util';

const INSTANT_WITH_OFFSET_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  @Max(MAX_IDENTITY_VALUE)
  doctorId: number;

  @IsInt()
  @Min(1)
  @Max(MAX_IDENTITY_VALUE)
  patientId: number;

  @IsString()
  @Matches(INSTANT_WITH_OFFSET_PATTERN, {
    message:
      'startsAt deve ser um instante ISO 8601 com fuso explícito (Z ou ±HH:MM)',
  })
  @IsISO8601({ strict: true, strictSeparator: true })
  startsAt: string;
}
