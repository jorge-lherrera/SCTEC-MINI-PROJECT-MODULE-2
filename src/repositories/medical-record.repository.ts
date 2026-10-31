import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from '../entities/medical-record.entity';
import { PageWindow } from '../utils/pagination.util';

export type CreatableMedicalRecord = Pick<
  MedicalRecord,
  'patientId' | 'doctorId' | 'text'
>;

@Injectable()
export class MedicalRecordRepository {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly repository: Repository<MedicalRecord>,
  ) {}

  public async create(data: CreatableMedicalRecord): Promise<MedicalRecord> {
    return this.repository.save(this.repository.create(data));
  }

  public async findPageByPatient(
    patientId: number,
    window: PageWindow,
  ): Promise<[MedicalRecord[], number]> {
    return this.repository.findAndCount({
      where: { patientId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: window.skip,
      take: window.take,
    });
  }
}
