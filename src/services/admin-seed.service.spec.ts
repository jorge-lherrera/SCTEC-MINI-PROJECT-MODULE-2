import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../entities/user-role.enum';
import { CreatableUser, UserRepository } from '../repositories/user.repository';
import { verifyPassword } from '../utils/hash.util';
import { AdminSeedService } from './admin-seed.service';

const ADMIN_SETTINGS: Record<string, string> = {
  ADMIN_NAME: 'Administrador',
  ADMIN_EMAIL: ' Admin@MedClinic.com ',
  ADMIN_PASSWORD: 'SenhaForte@123',
};

function createUserRepositoryDouble() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    existsByEmail: vi.fn(),
  };
}

function createConfigServiceDouble(): ConfigService {
  return {
    getOrThrow: (key: string): string => ADMIN_SETTINGS[key],
  } as unknown as ConfigService;
}

describe('AdminSeedService', () => {
  let userRepository: ReturnType<typeof createUserRepositoryDouble>;
  let adminSeedService: AdminSeedService;

  beforeEach(() => {
    userRepository = createUserRepositoryDouble();
    adminSeedService = new AdminSeedService(
      userRepository as unknown as UserRepository,
      createConfigServiceDouble(),
    );
  });

  it('cria o administrador inicial com as credenciais do ambiente', async () => {
    userRepository.existsByEmail.mockResolvedValue(false);

    await adminSeedService.onApplicationBootstrap();

    expect(userRepository.existsByEmail).toHaveBeenCalledWith(
      'admin@medclinic.com',
    );
    const created: CreatableUser = userRepository.create.mock.calls[0][0];
    expect(created.name).toBe('Administrador');
    expect(created.email).toBe('admin@medclinic.com');
    expect(created.roles).toEqual([UserRole.ADMIN]);
    expect(await verifyPassword('SenhaForte@123', created.password)).toBe(true);
  });

  it('não recria o administrador quando ele já existe', async () => {
    userRepository.existsByEmail.mockResolvedValue(true);

    await adminSeedService.onApplicationBootstrap();

    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
