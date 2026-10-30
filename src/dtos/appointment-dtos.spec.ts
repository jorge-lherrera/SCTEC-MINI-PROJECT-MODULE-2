import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateAppointmentDto } from './create-appointment.dto';
import { ListAppointmentsQueryDto } from './list-appointments-query.dto';

const VALID_APPOINTMENT = {
  doctorId: 3,
  patientId: 10,
  startsAt: '2026-10-13T08:00:00-03:00',
};

function isValid(payload: Record<string, unknown>): boolean {
  return (
    validateSync(plainToInstance(CreateAppointmentDto, payload)).length === 0
  );
}

describe('CreateAppointmentDto', () => {
  it.each([
    '2026-10-13T08:00:00-03:00',
    '2026-10-13T11:00:00Z',
    '2026-10-13T11:00:00.000Z',
    '2026-10-13T08:00-03:00',
  ])('aceita instante com fuso explícito %s', (startsAt) => {
    expect(isValid({ ...VALID_APPOINTMENT, startsAt })).toBe(true);
  });

  it.each([
    { startsAt: '2026-10-13T08:00:00' },
    { startsAt: '2026-10-13' },
    { startsAt: '2026-02-30T08:00:00-03:00' },
    { startsAt: '13/10/2026 08:00' },
    { startsAt: 1760353200000 },
    { startsAt: undefined },
    { doctorId: '3' },
    { doctorId: 0 },
    { doctorId: 2_147_483_648 },
    { patientId: 1.5 },
    { patientId: undefined },
  ])('recusa %o', (override) => {
    expect(isValid({ ...VALID_APPOINTMENT, ...override })).toBe(false);
  });
});

describe('ListAppointmentsQueryDto', () => {
  function parse(query: Partial<Record<string, string>>) {
    const dto = plainToInstance(ListAppointmentsQueryDto, query);

    return { dto, valid: validateSync(dto).length === 0 };
  }

  it('aceita todos os filtros combinados', () => {
    const { dto, valid } = parse({
      doctorId: '3',
      patientId: '10',
      status: 'in_progress',
      from: '2026-10-13',
      to: '2026-10-20',
    });

    expect(valid).toBe(true);
    expect(dto.doctorId).toBe(3);
    expect(dto.patientId).toBe(10);
  });

  it.each([
    { doctorId: 'abc' },
    { patientId: '0' },
    { status: 'finished' },
    { from: '13/10/2026' },
    { from: '2026-02-30' },
    { to: '2026-10-13T00:00:00Z' },
  ])('recusa filtro inválido %o', (query) => {
    expect(parse(query).valid).toBe(false);
  });
});
