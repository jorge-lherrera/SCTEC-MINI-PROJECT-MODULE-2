import { PaginationQueryDto } from '../dtos/pagination-query.dto';

export interface PageWindow {
  skip: number;
  take: number;
}

export function toPageWindow({
  page,
  pageSize,
}: PaginationQueryDto): PageWindow {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
