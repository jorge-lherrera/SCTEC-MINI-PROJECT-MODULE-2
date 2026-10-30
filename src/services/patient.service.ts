import { Injectable } from '@nestjs/common';
import { CreatePatientDto } from '../dtos/create-patient.dto';
import { NameSearchQueryDto } from '../dtos/name-search-query.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { PatientResponseDto } from '../dtos/patient-response.dto';
import { UpdatePatientDto } from '../dtos/update-patient.dto';
import { Patient } from '../entities/patient.entity';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { PatientRepository } from '../repositories/patient.repository';
import { toPageWindow } from '../utils/pagination.util';

@Injectable()
export class PatientService {
  constructor(private readonly patientRepository: PatientRepository) {}

  public async create(data: CreatePatientDto): Promise<PatientResponseDto> {
    if (await this.patientRepository.existsByCpf(data.cpf)) {
      throw new DomainError(ErrorCode.CPF_JA_CADASTRADO, 'CPF já cadastrado.');
    }

    const patient = await this.patientRepository.create({
      name: data.name,
      cpf: data.cpf,
    });

    return new PatientResponseDto(patient);
  }

  public async findPage(
    query: NameSearchQueryDto,
  ): Promise<PaginatedResponseDto<PatientResponseDto>> {
    const [patients, total] = await this.patientRepository.findPage(
      query.name,
      toPageWindow(query),
    );

    return new PaginatedResponseDto(
      patients.map((patient) => new PatientResponseDto(patient)),
      total,
      query,
    );
  }

  public async findById(id: number): Promise<PatientResponseDto> {
    return new PatientResponseDto(await this.getExistingPatient(id));
  }

  public async update(
    id: number,
    data: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.getExistingPatient(id);

    if (data.name !== undefined) {
      patient.name = data.name;
    }

    return new PatientResponseDto(await this.patientRepository.save(patient));
  }

  public async remove(id: number): Promise<void> {
    if (!(await this.patientRepository.softDeleteById(id))) {
      throw this.patientNotFound();
    }
  }

  private async getExistingPatient(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findById(id);

    if (patient === null) {
      throw this.patientNotFound();
    }

    return patient;
  }

  private patientNotFound(): DomainError {
    return new DomainError(
      ErrorCode.RECURSO_NAO_ENCONTRADO,
      'Paciente não encontrado.',
    );
  }
}
