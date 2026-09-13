import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserRole } from '../entities/user-role.enum';
import { UserRepository } from '../repositories/user.repository';
import { normalizeEmail } from '../utils/email.util';
import { hashPassword } from '../utils/hash.util';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async register(data: CreateUserDto): Promise<UserResponseDto> {
    const email = normalizeEmail(data.email);

    if (await this.userRepository.existsByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.userRepository.create({
      name: data.name.trim(),
      email,
      password: await hashPassword(data.password),
      role: data.role ?? UserRole.ATENDENTE,
    });

    return new UserResponseDto(user);
  }

  public async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto(user);
  }
}
