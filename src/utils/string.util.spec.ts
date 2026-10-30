import { describe, expect, it } from 'vitest';
import { escapeLikePattern } from './string.util';

describe('escapeLikePattern', () => {
  it('trata curingas do LIKE como texto literal', () => {
    expect(escapeLikePattern('50%_off\\x')).toBe('50\\%\\_off\\\\x');
  });

  it('mantém texto sem curingas', () => {
    expect(escapeLikePattern('Carlos')).toBe('Carlos');
  });
});
