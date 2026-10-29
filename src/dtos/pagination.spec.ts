import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { toPageWindow } from '../utils/pagination.util';
import { PaginatedResponseDto } from './paginated-response.dto';
import { PaginationQueryDto } from './pagination-query.dto';

function parseQuery(query: Partial<Record<'page' | 'pageSize', string>>): {
  pagination: PaginationQueryDto;
  valid: boolean;
} {
  const pagination = plainToInstance(PaginationQueryDto, query);

  return { pagination, valid: validateSync(pagination).length === 0 };
}

describe('paginação', () => {
  it('usa página 1 e tamanho 20 quando a query não informa', () => {
    const { pagination, valid } = parseQuery({});

    expect(valid).toBe(true);
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(20);
  });

  it('converte os valores da query string para número', () => {
    const { pagination, valid } = parseQuery({ page: '3', pageSize: '100' });

    expect(valid).toBe(true);
    expect(pagination.page).toBe(3);
    expect(pagination.pageSize).toBe(100);
  });

  it.each([
    { page: '0' },
    { page: '-1' },
    { page: 'abc' },
    { page: '1.5' },
    { pageSize: '0' },
    { pageSize: '101' },
    { pageSize: 'dez' },
  ])('recusa valor inválido %o', (query) => {
    expect(parseQuery(query).valid).toBe(false);
  });

  it('calcula a janela de registros da página', () => {
    const { pagination } = parseQuery({ page: '3', pageSize: '20' });

    expect(toPageWindow(pagination)).toEqual({ skip: 40, take: 20 });
  });

  it('monta o envelope com os metadados de paginação', () => {
    const { pagination } = parseQuery({ page: '2', pageSize: '20' });

    expect(new PaginatedResponseDto(['a', 'b'], 57, pagination)).toEqual({
      data: ['a', 'b'],
      meta: { total: 57, page: 2, pageSize: 20, totalPages: 3 },
    });
  });

  it('informa zero páginas quando não há registros', () => {
    const { pagination } = parseQuery({});

    expect(new PaginatedResponseDto([], 0, pagination).meta.totalPages).toBe(0);
  });
});
