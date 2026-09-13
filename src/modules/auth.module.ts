import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { UserService } from '../services/user.service';
import { UserModule } from './user.module';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [UserService],
})
export class AuthModule {}
