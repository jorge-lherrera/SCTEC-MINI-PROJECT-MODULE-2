import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordController } from '../controllers/medical-record.controller';
import { MedicalRecord } from '../entities/medical-record.entity';
import { MedicalRecordRepository } from '../repositories/medical-record.repository';
import { MedicalRecordService } from '../services/medical-record.service';
import { AppointmentModule } from './appointment.module';
import { DoctorModule } from './doctor.module';
import { PatientModule } from './patient.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecord]),
    PatientModule,
    DoctorModule,
    AppointmentModule,
  ],
  controllers: [MedicalRecordController],
  providers: [MedicalRecordRepository, MedicalRecordService],
})
export class MedicalRecordModule {}
