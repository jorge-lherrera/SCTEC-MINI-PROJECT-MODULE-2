import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { AppointmentResponseDto } from '../dtos/appointment-response.dto';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { UserRole } from '../entities/user-role.enum';
import { AppointmentService } from '../services/appointment.service';

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
}
