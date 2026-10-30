import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from '../controllers/doctor.controller';
import { Doctor } from '../entities/doctor.entity';
import { DoctorRepository } from '../repositories/doctor.repository';
import { DoctorService } from '../services/doctor.service';
import { TransactionModule } from './transaction.module';
import { UserModule } from './user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor]), UserModule, TransactionModule],
  controllers: [DoctorController],
  providers: [DoctorRepository, DoctorService],
  exports: [DoctorRepository],
})
export class DoctorModule {}
