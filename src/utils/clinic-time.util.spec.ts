import { describe, expect, it } from 'vitest';
import { startOfClinicDay, toClinicLocalTime } from './clinic-time.util';

describe('toClinicLocalTime', () => {
  it.each([
    ['2026-10-13T08:00:00-03:00', 2, 480],
    ['2026-10-13T11:00:00Z', 2, 480],
    ['2026-10-14T02:30:00Z', 2, 1410],
    ['2026-10-11T03:00:00Z', 0, 0],
    ['2026-10-17T23:59:00-03:00', 6, 1439],
  ])('converte %s para dia %i e minuto %i em America/Sao_Paulo', (instant, weekDay, minuteOfDay) => {
    expect(toClinicLocalTime(new Date(instant))).toEqual({
      weekDay,
      minuteOfDay,
    });
  });
});

describe('startOfClinicDay', () => {
  it.each([
    ['2026-10-13', 0, '2026-10-13T03:00:00.000Z'],
    ['2026-10-13', 1, '2026-10-14T03:00:00.000Z'],
    ['2026-12-31', 1, '2027-01-01T03:00:00.000Z'],
    ['2018-02-17', 1, '2018-02-18T03:00:00.000Z'],
  ])('início do dia %s deslocado %i dia(s) é %s', (date, dayOffset, expected) => {
    expect(startOfClinicDay(date, dayOffset).toISOString()).toBe(expected);
  });
});
