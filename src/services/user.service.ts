import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { UserRepository } from '../repositories/user.repository';
import { normalizeEmail } from '../utils/email.util';
import { hashPassword } from '../utils/hash.util';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async create(data: CreateUserDto): Promise<UserResponseDto> {
    const email = normalizeEmail(data.email);

    if (await this.userRepository.existsByEmail(email)) {
      throw new DomainError(
        ErrorCode.EMAIL_JA_CADASTRADO,
        'E-mail já cadastrado.',
      );
    }

    const user = await this.userRepository.create({
      name: data.name,
      email,
      password: await hashPassword(data.password),
      roles: [...new Set(data.roles)],
    });

    return new UserResponseDto(user);
  }

  public async findById(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);

    if (user === null) {
      throw new DomainError(
        ErrorCode.RECURSO_NAO_ENCONTRADO,
        'Usuário não encontrado.',
      );
    }

    return new UserResponseDto(user);
  }
}
