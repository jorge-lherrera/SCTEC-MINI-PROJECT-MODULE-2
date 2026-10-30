import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateAppointmentDto } from './create-appointment.dto';

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
