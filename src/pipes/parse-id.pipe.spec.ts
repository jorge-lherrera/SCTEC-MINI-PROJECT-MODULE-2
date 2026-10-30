import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ParseIdPipe } from './parse-id.pipe';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();

  it.each([
    ['1', 1],
    ['10', 10],
    ['2147483647', 2_147_483_647],
  ])('converte %s para número', (value, expected) => {
    expect(pipe.transform(value)).toBe(expected);
  });

  it.each(['0', '-1', '01', '1.5', 'abc', '1e3', ' 1', '', '2147483648'])(
    'recusa o identificador %j',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException);
    },
  );
});
