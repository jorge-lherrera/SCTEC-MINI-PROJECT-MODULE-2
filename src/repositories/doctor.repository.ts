import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ILike, Repository } from 'typeorm';
import { DOCTOR_CRM_UNIQUE_CONSTRAINT, Doctor } from '../entities/doctor.entity';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { isUniqueViolation } from '../utils/database-error.util';
import { PageWindow } from '../utils/pagination.util';
import { escapeLikePattern } from '../utils/string.util';

export type CreatableDoctor = Pick<Doctor, 'crm' | 'user'>;

@Injectable()
export class DoctorRepository {
  constructor(
    @InjectRepository(Doctor)
    private readonly repository: Repository<Doctor>,
  ) {}

  public async create(
    data: CreatableDoctor,
    manager?: EntityManager,
  ): Promise<Doctor> {
    const repository = manager?.getRepository(Doctor) ?? this.repository;

    try {
      return await repository.save(repository.create(data));
    } catch (error) {
      if (isUniqueViolation(error, DOCTOR_CRM_UNIQUE_CONSTRAINT)) {
        throw new DomainError(
          ErrorCode.CRM_JA_CADASTRADO,
          'CRM já cadastrado.',
        );
      }

      throw error;
    }
  }

  public async findById(id: number): Promise<Doctor | null> {
    return this.repository.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  public async existsByCrm(crm: string): Promise<boolean> {
    return this.repository.existsBy({ crm });
  }

  public async findPage(
    name: string | undefined,
    window: PageWindow,
  ): Promise<[Doctor[], number]> {
    return this.repository.findAndCount({
      where: name
        ? { user: { name: ILike(`%${escapeLikePattern(name)}%`) } }
        : {},
      relations: { user: true },
      order: { user: { name: 'ASC' }, id: 'ASC' },
      skip: window.skip,
      take: window.take,
    });
  }
}
