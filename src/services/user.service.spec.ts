import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';
import { ErrorCode } from '../errors/error-code.enum';
import { CreatableUser, UserRepository } from '../repositories/user.repository';
import { verifyPassword } from '../utils/hash.util';
import { UserService } from './user.service';

function createUserRepositoryDouble() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    existsByEmail: vi.fn(),
  };
}

function persist(data: CreatableUser): User {
  return {
    ...data,
    id: '0b5c8d2e-6f4a-4b3c-8d1e-2f3a4b5c6d7e',
    createdAt: new Date('2026-10-20T14:03:11.000Z'),
  };
}

describe('UserService', () => {
  let userRepository: ReturnType<typeof createUserRepositoryDouble>;
  let userService: UserService;

  beforeEach(() => {
    userRepository = createUserRepositoryDouble();
    userService = new UserService(userRepository as unknown as UserRepository);
  });

  describe('register', () => {
    it('recusa e-mail já cadastrado sem criar usuário', async () => {
      userRepository.existsByEmail.mockResolvedValue(true);

      await expect(
        userService.register({
          name: 'Joana',
          email: 'joana@medclinic.com',
          password: 'SenhaForte@123',
        }),
      ).rejects.toMatchObject({ code: ErrorCode.EMAIL_JA_CADASTRADO });
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('grava a senha como hash, normaliza os dados e usa o perfil padrão', async () => {
      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.create.mockImplementation(async (data: CreatableUser) =>
        persist(data),
      );

      const response = await userService.register({
        name: '  Joana Secretária ',
        email: ' Joana@MedClinic.com ',
        password: 'SenhaForte@123',
      });

      const saved: CreatableUser = userRepository.create.mock.calls[0][0];
      expect(saved.name).toBe('Joana Secretária');
      expect(saved.email).toBe('joana@medclinic.com');
      expect(saved.role).toBe(UserRole.ATENDENTE);
      expect(saved.password).not.toBe('SenhaForte@123');
      expect(await verifyPassword('SenhaForte@123', saved.password)).toBe(true);
      expect(response).not.toHaveProperty('password');
    });

    it('respeita o perfil informado', async () => {
      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.create.mockImplementation(async (data: CreatableUser) =>
        persist(data),
      );

      const response = await userService.register({
        name: 'Administrador',
        email: 'admin@medclinic.com',
        password: 'SenhaForte@123',
        role: UserRole.ADMINISTRADOR,
      });

      expect(response.role).toBe(UserRole.ADMINISTRADOR);
    });
  });

  describe('findById', () => {
    it('lança recurso não encontrado quando o usuário não existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.findById('inexistente')).rejects.toMatchObject({
        code: ErrorCode.RECURSO_NAO_ENCONTRADO,
      });
    });

    it('devolve o usuário sem a senha', async () => {
      userRepository.findById.mockResolvedValue(
        persist({
          name: 'Joana',
          email: 'joana@medclinic.com',
          password: 'hash',
          role: UserRole.ATENDENTE,
        }),
      );

      const response = await userService.findById('0b5c8d2e-6f4a-4b3c-8d1e-2f3a4b5c6d7e');

      expect(response.email).toBe('joana@medclinic.com');
      expect(response).not.toHaveProperty('password');
    });
  });
});
