import { IsCalendarDate } from '../decorators/is-calendar-date.decorator';

export class CalendarQueryDto {
  @IsCalendarDate()
  from: string;

  @IsCalendarDate()
  to: string;
}
