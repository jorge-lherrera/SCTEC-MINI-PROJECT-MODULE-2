import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from '../controllers/appointment.controller';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { AppointmentService } from '../services/appointment.service';
import { DoctorModule } from './doctor.module';
import { PatientModule } from './patient.module';
import { TransactionModule } from './transaction.module';
import { WorkScheduleModule } from './work-schedule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    DoctorModule,
    PatientModule,
    WorkScheduleModule,
    TransactionModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentRepository, AppointmentService],
  exports: [AppointmentRepository],
})
export class AppointmentModule {}
