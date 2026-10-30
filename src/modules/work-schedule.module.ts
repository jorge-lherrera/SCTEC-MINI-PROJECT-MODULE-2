import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkScheduleController } from '../controllers/work-schedule.controller';
import { WorkShift } from '../entities/work-shift.entity';
import { WorkShiftRepository } from '../repositories/work-shift.repository';
import { WorkScheduleService } from '../services/work-schedule.service';
import { DoctorModule } from './doctor.module';
import { TransactionModule } from './transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkShift]),
    DoctorModule,
    TransactionModule,
  ],
  controllers: [WorkScheduleController],
  providers: [WorkShiftRepository, WorkScheduleService],
  exports: [WorkShiftRepository],
})
export class WorkScheduleModule {}
