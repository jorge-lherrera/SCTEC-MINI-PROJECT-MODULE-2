import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';
import { ErrorCode } from '../errors/error-code.enum';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/hash.util';
import { JwtPayload } from '../utils/jwt-payload.interface';
import { AuthService } from './auth.service';

const PLAIN_PASSWORD = 'SenhaForte@123';

function createUserRepositoryDouble() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    existsByEmail: vi.fn(),
  };
}

async function buildStoredUser(): Promise<User> {
  return {
    id: '7d6f5c1e-3a2b-4c8d-9e0f-1a2b3c4d5e6f',
    name: 'Administrador',
    email: 'admin@medclinic.com',
    password: await hashPassword(PLAIN_PASSWORD),
    role: UserRole.ADMINISTRADOR,
    createdAt: new Date('2026-10-20T14:03:11.000Z'),
  };
}

describe('AuthService.login', () => {
  const jwtService = new JwtService({
    secret: 'test-secret',
    signOptions: { expiresIn: '1h' },
  });
  let userRepository: ReturnType<typeof createUserRepositoryDouble>;
  let authService: AuthService;

  beforeEach(() => {
    userRepository = createUserRepositoryDouble();
    authService = new AuthService(
      userRepository as unknown as UserRepository,
      jwtService,
    );
  });

  it('recusa e-mail inexistente com erro de autenticação', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'ninguem@medclinic.com', password: PLAIN_PASSWORD }),
    ).rejects.toMatchObject({ code: ErrorCode.CREDENCIAIS_INVALIDAS });
  });

  it('recusa senha que não confere com o hash armazenado', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(
      await buildStoredUser(),
    );

    await expect(
      authService.login({ email: 'admin@medclinic.com', password: 'senha-errada' }),
    ).rejects.toMatchObject({ code: ErrorCode.CREDENCIAIS_INVALIDAS });
  });

  it('autentica comparando a senha com o hash e emite token com id e perfil', async () => {
    const storedUser = await buildStoredUser();
    userRepository.findByEmailWithPassword.mockResolvedValue(storedUser);

    const response = await authService.login({
      email: '  Admin@MedClinic.com ',
      password: PLAIN_PASSWORD,
    });

    expect(storedUser.password).not.toBe(PLAIN_PASSWORD);
    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(
      'admin@medclinic.com',
    );
    const payload = await jwtService.verifyAsync<JwtPayload>(response.token);
    expect(payload.sub).toBe(storedUser.id);
    expect(payload.role).toBe(UserRole.ADMINISTRADOR);
    expect(response.user).not.toHaveProperty('password');
  });
});
