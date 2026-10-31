import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { CreateMedicalRecordDto } from '../dtos/create-medical-record.dto';
import { MedicalRecordResponseDto } from '../dtos/medical-record-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { UserRole } from '../entities/user-role.enum';
import { ParseIdPipe } from '../pipes/parse-id.pipe';
import { MedicalRecordService } from '../services/medical-record.service';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

@Controller('patients/:patientId/medical-records')
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  @Post()
  @Roles(UserRole.DOCTOR)
  public async create(
    @Param('patientId', ParseIdPipe) patientId: number,
    @Body() data: CreateMedicalRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MedicalRecordResponseDto> {
    return this.medicalRecordService.create(patientId, data, user);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  public async findPage(
    @Param('patientId', ParseIdPipe) patientId: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<MedicalRecordResponseDto>> {
    return this.medicalRecordService.findPage(patientId, query, user);
  }
}
