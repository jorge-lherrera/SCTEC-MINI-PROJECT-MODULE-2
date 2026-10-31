import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CalendarQueryDto } from './calendar-query.dto';

function isValid(query: Partial<Record<string, string>>): boolean {
  return validateSync(plainToInstance(CalendarQueryDto, query)).length === 0;
}

describe('CalendarQueryDto', () => {
  it('aceita from e to no formato YYYY-MM-DD', () => {
    expect(isValid({ from: '2026-10-12', to: '2026-10-16' })).toBe(true);
  });

  it.each([
    { to: '2026-10-16' },
    { from: '2026-10-12' },
    { from: '', to: '2026-10-16' },
    { from: '12/10/2026', to: '2026-10-16' },
    { from: '2026-10-12', to: '2026-02-30' },
    { from: '2026-10-12T00:00:00Z', to: '2026-10-16' },
  ])('recusa %o', (query) => {
    expect(isValid(query)).toBe(false);
  });
});
