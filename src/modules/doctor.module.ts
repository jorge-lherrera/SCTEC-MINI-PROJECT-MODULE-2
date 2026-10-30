import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from '../controllers/doctor.controller';
import { TransactionRunner } from '../database/transaction-runner';
import { Doctor } from '../entities/doctor.entity';
import { DoctorRepository } from '../repositories/doctor.repository';
import { DoctorService } from '../services/doctor.service';
import { UserModule } from './user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor]), UserModule],
  controllers: [DoctorController],
  providers: [DoctorRepository, DoctorService, TransactionRunner],
  exports: [DoctorRepository],
})
export class DoctorModule {}
