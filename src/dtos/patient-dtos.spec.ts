import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreatePatientDto } from './create-patient.dto';
import { ListPatientsQueryDto } from './list-patients-query.dto';
import { UpdatePatientDto } from './update-patient.dto';

function isValid<T extends object>(
  dto: new () => T,
  payload: Record<string, unknown>,
): boolean {
  return validateSync(plainToInstance(dto, payload)).length === 0;
}

describe('CreatePatientDto', () => {
  it('aceita nome e CPF com 11 dígitos', () => {
    expect(
      isValid(CreatePatientDto, { name: 'Carlos Pereira', cpf: '12345678901' }),
    ).toBe(true);
  });

  it('remove espaços nas pontas do nome', () => {
    const dto = plainToInstance(CreatePatientDto, {
      name: '  Carlos Pereira  ',
      cpf: '12345678901',
    });

    expect(dto.name).toBe('Carlos Pereira');
  });

  it.each([
    { cpf: '1234567890' },
    { cpf: '123456789012' },
    { cpf: '123.456.789-01' },
    { cpf: '1234567890a' },
    { cpf: ' 12345678901' },
    { cpf: 12345678901 },
    {},
  ])('recusa CPF inválido %o', (cpf) => {
    expect(isValid(CreatePatientDto, { name: 'Carlos', ...cpf })).toBe(false);
  });

  it.each([{}, { name: '' }, { name: '   ' }, { name: 'a'.repeat(121) }])(
    'recusa nome ausente, vazio ou longo demais %#',
    (name) => {
      expect(isValid(CreatePatientDto, { cpf: '12345678901', ...name })).toBe(
        false,
      );
    },
  );
});

describe('UpdatePatientDto', () => {
  it('aceita corpo sem campos', () => {
    expect(isValid(UpdatePatientDto, {})).toBe(true);
  });

  it.each([{ name: null }, { name: '' }, { name: '  ' }, { name: 7 }])(
    'recusa nome inválido %o',
    (payload) => {
      expect(isValid(UpdatePatientDto, payload)).toBe(false);
    },
  );
});

describe('ListPatientsQueryDto', () => {
  it('aceita a busca por nome junto da paginação', () => {
    const query = plainToInstance(ListPatientsQueryDto, {
      name: ' carl ',
      pageSize: '5',
    });

    expect(validateSync(query)).toHaveLength(0);
    expect(query.name).toBe('carl');
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(5);
  });
});
