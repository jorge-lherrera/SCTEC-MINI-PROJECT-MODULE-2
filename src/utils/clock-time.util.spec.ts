import { describe, expect, it } from 'vitest';
import {
  CLOCK_TIME_PATTERN,
  clockTimeToMinutes,
  toClockTime,
} from './clock-time.util';

describe('clock-time', () => {
  it.each([
    ['00:00', 0],
    ['08:30', 510],
    ['23:59', 1439],
  ])('converte %s em %i minutos do dia', (clockTime, minutes) => {
    expect(clockTimeToMinutes(clockTime)).toBe(minutes);
  });

  it('corta os segundos do horário vindo do banco', () => {
    expect(toClockTime('14:00:00')).toBe('14:00');
    expect(toClockTime('14:00')).toBe('14:00');
  });

  it.each(['00:00', '09:05', '23:59'])('aceita %s como HH:MM', (value) => {
    expect(CLOCK_TIME_PATTERN.test(value)).toBe(true);
  });

  it.each(['8:00', '24:00', '12:60', '12:00:00', '1200', 'ab:cd'])(
    'recusa %s fora do formato HH:MM',
    (value) => {
      expect(CLOCK_TIME_PATTERN.test(value)).toBe(false);
    },
  );
});
