import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { CreatePatientDto } from '../dtos/create-patient.dto';
import { NameSearchQueryDto } from '../dtos/name-search-query.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { PatientResponseDto } from '../dtos/patient-response.dto';
import { UpdatePatientDto } from '../dtos/update-patient.dto';
import { UserRole } from '../entities/user-role.enum';
import { ParseIdPipe } from '../pipes/parse-id.pipe';
import { PatientService } from '../services/patient.service';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  public async create(
    @Body() data: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientService.create(data);
  }

  @Get()
  public async findPage(
    @Query() query: NameSearchQueryDto,
  ): Promise<PaginatedResponseDto<PatientResponseDto>> {
    return this.patientService.findPage(query);
  }

  @Get(':id')
  public async findById(
    @Param('id', ParseIdPipe) id: number,
  ): Promise<PatientResponseDto> {
    return this.patientService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  public async update(
    @Param('id', ParseIdPipe) id: number,
    @Body() data: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    await this.patientService.remove(id);
  }
}
