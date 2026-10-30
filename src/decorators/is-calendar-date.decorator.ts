import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';
import { CALENDAR_DATE_PATTERN } from '../utils/clinic-time.util';

export const IsCalendarDate = (): PropertyDecorator =>
  applyDecorators(
    Matches(CALENDAR_DATE_PATTERN, {
      message: '$property deve estar no formato YYYY-MM-DD',
    }),
    IsISO8601({ strict: true }),
  );
