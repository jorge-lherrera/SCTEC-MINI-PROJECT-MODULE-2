import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateDoctorDto } from './create-doctor.dto';

const VALID_DOCTOR = {
  name: 'Dra. Helena Souza',
  email: 'helena@medclinic.com',
  password: 'SenhaForte@123',
  crm: 'CRM-SC-54321',
};

function isValid(payload: Record<string, unknown>): boolean {
  return validateSync(plainToInstance(CreateDoctorDto, payload)).length === 0;
}

describe('CreateDoctorDto', () => {
  it('aceita os dados de acesso e o CRM', () => {
    expect(isValid(VALID_DOCTOR)).toBe(true);
  });

  it('remove espaços nas pontas do CRM', () => {
    const dto = plainToInstance(CreateDoctorDto, {
      ...VALID_DOCTOR,
      crm: '  CRM-SC-54321 ',
    });

    expect(dto.crm).toBe('CRM-SC-54321');
  });

  it.each([
    { crm: undefined },
    { crm: '' },
    { crm: '   ' },
    { crm: 'C'.repeat(31) },
    { crm: 54321 },
    { name: '' },
    { email: 'nao-e-email' },
    { password: 'curta' },
    { password: undefined },
  ])('recusa campo inválido ou ausente %o', (override) => {
    expect(isValid({ ...VALID_DOCTOR, ...override })).toBe(false);
  });
});
