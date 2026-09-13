import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { normalizeEmail } from '../utils/email.util';
import { verifyPassword } from '../utils/hash.util';
import { JwtPayload } from '../utils/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  public async login(data: LoginDto): Promise<AuthResponseDto> {
    const user = await this.findAuthenticatedUser(data);
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return new AuthResponseDto(token, new UserResponseDto(user));
  }

  private async findAuthenticatedUser(data: LoginDto): Promise<User> {
    const email = normalizeEmail(data.email);
    const user = await this.userRepository.findByEmailWithPassword(email);

    if (user === null) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await verifyPassword(data.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
