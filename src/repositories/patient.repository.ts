import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ILike, IsNull, Repository } from 'typeorm';
import { PATIENT_CPF_UNIQUE_INDEX, Patient } from '../entities/patient.entity';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { isUniqueViolation } from '../utils/database-error.util';
import { PageWindow } from '../utils/pagination.util';
import { escapeLikePattern } from '../utils/string.util';

export type CreatablePatient = Pick<Patient, 'name' | 'cpf'>;

@Injectable()
export class PatientRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly repository: Repository<Patient>,
  ) {}

  public async create(data: CreatablePatient): Promise<Patient> {
    try {
      return await this.repository.save(this.repository.create(data));
    } catch (error) {
      if (isUniqueViolation(error, PATIENT_CPF_UNIQUE_INDEX)) {
        throw new DomainError(
          ErrorCode.CPF_JA_CADASTRADO,
          'CPF já cadastrado.',
        );
      }

      throw error;
    }
  }

  public async save(patient: Patient): Promise<Patient> {
    return this.repository.save(patient);
  }

  public async findById(id: number): Promise<Patient | null> {
    return this.repository.findOneBy({ id });
  }

  public async existsById(id: number): Promise<boolean> {
    return this.repository.existsBy({ id });
  }

  public async lockById(
    id: number,
    manager: EntityManager,
  ): Promise<Patient | null> {
    return manager.getRepository(Patient).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  public async existsByCpf(cpf: string): Promise<boolean> {
    return this.repository.existsBy({ cpf });
  }

  public async findPage(
    name: string | undefined,
    window: PageWindow,
  ): Promise<[Patient[], number]> {
    return this.repository.findAndCount({
      where: name ? { name: ILike(`%${escapeLikePattern(name)}%`) } : {},
      order: { name: 'ASC', id: 'ASC' },
      skip: window.skip,
      take: window.take,
    });
  }

  public async softDeleteById(id: number): Promise<boolean> {
    const result = await this.repository.softDelete({
      id,
      deletedAt: IsNull(),
    });

    return (result.affected ?? 0) > 0;
  }
}
