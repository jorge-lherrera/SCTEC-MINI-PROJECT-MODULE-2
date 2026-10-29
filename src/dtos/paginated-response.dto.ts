import { PaginationQueryDto } from './pagination-query.dto';

export class PaginationMetaDto {
  public readonly total: number;
  public readonly page: number;
  public readonly pageSize: number;
  public readonly totalPages: number;

  constructor(total: number, page: number, pageSize: number) {
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}

export class PaginatedResponseDto<T> {
  public readonly data: T[];
  public readonly meta: PaginationMetaDto;

  constructor(data: T[], total: number, pagination: PaginationQueryDto) {
    this.data = data;
    this.meta = new PaginationMetaDto(
      total,
      pagination.page,
      pagination.pageSize,
    );
  }
}
