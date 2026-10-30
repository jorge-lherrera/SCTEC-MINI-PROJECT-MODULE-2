import { Controller, Get, Param, Query } from '@nestjs/common';
import { CalendarQueryDto } from '../dtos/calendar-query.dto';
import { DoctorCalendarResponseDto } from '../dtos/doctor-calendar-response.dto';
import { ParseIdPipe } from '../pipes/parse-id.pipe';
import { DoctorCalendarService } from '../services/doctor-calendar.service';

@Controller('doctors/:doctorId/calendar')
export class DoctorCalendarController {
  constructor(private readonly doctorCalendarService: DoctorCalendarService) {}

  @Get()
  public async find(
    @Param('doctorId', ParseIdPipe) doctorId: number,
    @Query() query: CalendarQueryDto,
  ): Promise<DoctorCalendarResponseDto> {
    return this.doctorCalendarService.find(doctorId, query);
  }
}
