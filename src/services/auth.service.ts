import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';
import { User } from '../entities/user.entity';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { UserRepository } from '../repositories/user.repository';
import { normalizeEmail } from '../utils/email.util';
import { verifyPassword } from '../utils/hash.util';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  public async login(data: LoginDto): Promise<AuthResponseDto> {
    const user = await this.findAuthenticatedUser(data);
    const payload: JwtPayload = { sub: String(user.id), roles: user.roles };

    return new AuthResponseDto(await this.jwtService.signAsync(payload));
  }

  private async findAuthenticatedUser(data: LoginDto): Promise<User> {
    const email = normalizeEmail(data.email);
    const user = await this.userRepository.findByEmailWithPassword(email);

    if (
      user === null ||
      !(await verifyPassword(data.password, user.password))
    ) {
      throw new DomainError(
        ErrorCode.CREDENCIAIS_INVALIDAS,
        'E-mail ou senha inválidos.',
      );
    }

    return user;
  }
}
