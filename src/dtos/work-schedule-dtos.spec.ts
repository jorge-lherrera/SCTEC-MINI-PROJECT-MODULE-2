import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { WorkScheduleDto } from './work-schedule.dto';

const VALID_SHIFT = {
  weekDay: 2,
  startTime: '08:00',
  endTime: '12:00',
  slotDurationMinutes: 30,
};

function isValid(payload: unknown): boolean {
  return validateSync(plainToInstance(WorkScheduleDto, payload)).length === 0;
}

describe('WorkScheduleDto', () => {
  it('aceita turnos no formato do contrato', () => {
    expect(isValid({ shifts: [VALID_SHIFT] })).toBe(true);
  });

  it('aceita lista vazia para apagar a escala', () => {
    expect(isValid({ shifts: [] })).toBe(true);
  });

  it.each([
    { weekDay: 7 },
    { weekDay: -1 },
    { weekDay: 1.5 },
    { weekDay: '2' },
    { startTime: '8:00' },
    { endTime: '24:00' },
    { slotDurationMinutes: 0 },
    { slotDurationMinutes: -10 },
    { slotDurationMinutes: 12.5 },
    { slotDurationMinutes: undefined },
  ])('recusa turno com %o', (override) => {
    expect(isValid({ shifts: [{ ...VALID_SHIFT, ...override }] })).toBe(false);
  });

  it.each([{}, { shifts: null }, { shifts: 'x' }, { shifts: [1] }])(
    'recusa corpo sem lista de turnos válida %o',
    (payload) => {
      expect(isValid(payload)).toBe(false);
    },
  );
});
