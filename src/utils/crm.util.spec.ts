import { describe, expect, it } from 'vitest';
import { normalizeCrm } from './crm.util';

describe('normalizeCrm', () => {
  it('padroniza o CRM em maiúsculas e sem espaços nas pontas', () => {
    expect(normalizeCrm('  crm-sc-54321 ')).toBe('CRM-SC-54321');
  });
});
