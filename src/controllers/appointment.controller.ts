import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { AppointmentResponseDto } from '../dtos/appointment-response.dto';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { ListAppointmentsQueryDto } from '../dtos/list-appointments-query.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { UpdateAppointmentStatusDto } from '../dtos/update-appointment-status.dto';
import { UserRole } from '../entities/user-role.enum';
import { ParseIdPipe } from '../pipes/parse-id.pipe';
import { AppointmentService } from '../services/appointment.service';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  public async create(
    @Body() data: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.create(data);
  }

  @Get()
  public async findPage(
    @Query() query: ListAppointmentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    return this.appointmentService.findPage(query, user);
  }

  @Get(':id')
  public async findById(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.findById(id, user);
  }

  @Patch(':id/status')
  public async changeStatus(
    @Param('id', ParseIdPipe) id: number,
    @Body() data: UpdateAppointmentStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.changeStatus(id, data, user);
  }
}
