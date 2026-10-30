import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientController } from '../controllers/patient.controller';
import { Patient } from '../entities/patient.entity';
import { PatientRepository } from '../repositories/patient.repository';
import { PatientService } from '../services/patient.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientController],
  providers: [PatientRepository, PatientService],
  exports: [PatientRepository],
})
export class PatientModule {}
