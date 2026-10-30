import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { WorkScheduleResponseDto } from '../dtos/work-schedule-response.dto';
import { WorkScheduleDto } from '../dtos/work-schedule.dto';
import { UserRole } from '../entities/user-role.enum';
import { ParseIdPipe } from '../pipes/parse-id.pipe';
import { WorkScheduleService } from '../services/work-schedule.service';

@Controller('doctors/:doctorId/work-schedule')
export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  @Put()
  @Roles(UserRole.ADMIN)
  public async replace(
    @Param('doctorId', ParseIdPipe) doctorId: number,
    @Body() data: WorkScheduleDto,
  ): Promise<WorkScheduleResponseDto> {
    return this.workScheduleService.replace(doctorId, data);
  }

  @Get()
  public async find(
    @Param('doctorId', ParseIdPipe) doctorId: number,
  ): Promise<WorkScheduleResponseDto> {
    return this.workScheduleService.find(doctorId);
  }
}
