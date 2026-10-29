import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '../controllers/user.controller';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { AdminSeedService } from '../services/admin-seed.service';
import { UserService } from '../services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserRepository, UserService, AdminSeedService],
  exports: [UserRepository, UserService],
})
export class UserModule {}
