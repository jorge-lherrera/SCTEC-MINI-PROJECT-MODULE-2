import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../database/transaction-runner';
import { CreateDoctorDto } from '../dtos/create-doctor.dto';
import { DoctorResponseDto } from '../dtos/doctor-response.dto';
import { NameSearchQueryDto } from '../dtos/name-search-query.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { UserRole } from '../entities/user-role.enum';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { DoctorRepository } from '../repositories/doctor.repository';
import { UserRepository } from '../repositories/user.repository';
import { normalizeCrm } from '../utils/crm.util';
import { normalizeEmail } from '../utils/email.util';
import { hashPassword } from '../utils/hash.util';
import { toPageWindow } from '../utils/pagination.util';

@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly userRepository: UserRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  public async create(data: CreateDoctorDto): Promise<DoctorResponseDto> {
    const email = normalizeEmail(data.email);
    const crm = normalizeCrm(data.crm);

    if (await this.userRepository.existsByEmail(email)) {
      throw new DomainError(
        ErrorCode.EMAIL_JA_CADASTRADO,
        'E-mail já cadastrado.',
      );
    }

    if (await this.doctorRepository.existsByCrm(crm)) {
      throw new DomainError(ErrorCode.CRM_JA_CADASTRADO, 'CRM já cadastrado.');
    }

    const password = await hashPassword(data.password);
    const doctor = await this.transactionRunner.run(async (manager) => {
      const user = await this.userRepository.create(
        { name: data.name, email, password, roles: [UserRole.DOCTOR] },
        manager,
      );

      return this.doctorRepository.create({ crm, user }, manager);
    });

    return new DoctorResponseDto(doctor);
  }

  public async findPage(
    query: NameSearchQueryDto,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    const [doctors, total] = await this.doctorRepository.findPage(
      query.name,
      toPageWindow(query),
    );

    return new PaginatedResponseDto(
      doctors.map((doctor) => new DoctorResponseDto(doctor)),
      total,
      query,
    );
  }

  public async findById(id: number): Promise<DoctorResponseDto> {
    const doctor = await this.doctorRepository.findById(id);

    if (doctor === null) {
      throw new DomainError(
        ErrorCode.RECURSO_NAO_ENCONTRADO,
        'Médico não encontrado.',
      );
    }

    return new DoctorResponseDto(doctor);
  }
}
