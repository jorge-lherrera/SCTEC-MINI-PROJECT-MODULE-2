import { describe, expect, it } from 'vitest';
import { Period, periodsOverlap } from './period.util';

const BASE: Period = { start: 600, end: 630 };

describe('periodsOverlap', () => {
  it.each<[string, Period, boolean]>([
    ['um antes do outro', { start: 540, end: 570 }, false],
    ['um depois do outro', { start: 660, end: 690 }, false],
    ['encostado antes', { start: 570, end: 600 }, false],
    ['encostado depois', { start: 630, end: 660 }, false],
    ['um dentro do outro', { start: 610, end: 620 }, true],
    ['um envolvendo o outro', { start: 590, end: 640 }, true],
    ['cruzando a borda do início', { start: 590, end: 610 }, true],
    ['cruzando a borda do fim', { start: 620, end: 650 }, true],
    ['mesmo período', { start: 600, end: 630 }, true],
  ])('%s', (_scenario, other, expected) => {
    expect(periodsOverlap(BASE, other)).toBe(expected);
    expect(periodsOverlap(other, BASE)).toBe(expected);
  });
});
