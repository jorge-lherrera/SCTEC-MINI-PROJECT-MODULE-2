import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { CreateDoctorDto } from '../dtos/create-doctor.dto';
import { DoctorResponseDto } from '../dtos/doctor-response.dto';
import { NameSearchQueryDto } from '../dtos/name-search-query.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { UserRole } from '../entities/user-role.enum';
import { ParseIdPipe } from '../pipes/parse-id.pipe';
import { DoctorService } from '../services/doctor.service';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  public async create(@Body() data: CreateDoctorDto): Promise<DoctorResponseDto> {
    return this.doctorService.create(data);
  }

  @Get()
  public async findPage(
    @Query() query: NameSearchQueryDto,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    return this.doctorService.findPage(query);
  }

  @Get(':id')
  public async findById(
    @Param('id', ParseIdPipe) id: number,
  ): Promise<DoctorResponseDto> {
    return this.doctorService.findById(id);
  }
}
