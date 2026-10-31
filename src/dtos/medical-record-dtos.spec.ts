import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  CreateMedicalRecordDto,
  MEDICAL_RECORD_TEXT_MAX_LENGTH,
} from './create-medical-record.dto';

function parse(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateMedicalRecordDto, payload);
  const errors = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  return { dto, valid: errors.length === 0 };
}

describe('CreateMedicalRecordDto', () => {
  it('aceita o texto e remove espaços das pontas', () => {
    const { dto, valid } = parse({ text: '  Solicitado raio-X.  ' });

    expect(valid).toBe(true);
    expect(dto.text).toBe('Solicitado raio-X.');
  });

  it('aceita doctorId no corpo sem rejeitar a requisição', () => {
    expect(parse({ text: 'Retorno em 15 dias.', doctorId: 99 }).valid).toBe(
      true,
    );
  });

  it.each([
    {},
    { text: '' },
    { text: '   ' },
    { text: 42 },
    { text: 'x'.repeat(MEDICAL_RECORD_TEXT_MAX_LENGTH + 1) },
    { text: 'Retorno em 15 dias.', patientId: 10 },
  ])('recusa %o', (payload) => {
    expect(parse(payload).valid).toBe(false);
  });
});
