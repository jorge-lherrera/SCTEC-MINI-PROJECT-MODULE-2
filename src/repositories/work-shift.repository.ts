import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WorkShift } from '../entities/work-shift.entity';

export type CreatableWorkShift = Pick<
  WorkShift,
  'weekDay' | 'startTime' | 'endTime' | 'slotDurationMinutes'
>;

@Injectable()
export class WorkShiftRepository {
  constructor(
    @InjectRepository(WorkShift)
    private readonly repository: Repository<WorkShift>,
  ) {}

  public async replaceForDoctor(
    doctorId: number,
    shifts: CreatableWorkShift[],
    manager: EntityManager,
  ): Promise<WorkShift[]> {
    const repository = manager.getRepository(WorkShift);

    await repository.delete({ doctorId });

    return repository.save(
      shifts.map((shift) => repository.create({ ...shift, doctorId })),
    );
  }

  public async findByDoctorId(
    doctorId: number,
    manager?: EntityManager,
  ): Promise<WorkShift[]> {
    const repository = manager?.getRepository(WorkShift) ?? this.repository;

    return repository.find({
      where: { doctorId },
      order: { weekDay: 'ASC', startTime: 'ASC' },
    });
  }
}
