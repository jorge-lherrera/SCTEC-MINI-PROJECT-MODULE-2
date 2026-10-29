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
    findByEmailWithPassword: vi.fn(),
    existsByEmail: vi.fn(),
  };
}

function persist(data: CreatableUser): User {
  return {
    ...data,
    id: 2,
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

  describe('create', () => {
    it('recusa e-mail já cadastrado sem criar usuário', async () => {
      userRepository.existsByEmail.mockResolvedValue(true);

      await expect(
        userService.create({
          name: 'Joana Secretária',
          email: 'joana@medclinic.com',
          password: 'SenhaForte@123',
          roles: [UserRole.SECRETARY],
        }),
      ).rejects.toMatchObject({ code: ErrorCode.EMAIL_JA_CADASTRADO });
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('grava a senha como hash, normaliza o e-mail e não repete perfis', async () => {
      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.create.mockImplementation(async (data: CreatableUser) =>
        persist(data),
      );

      const response = await userService.create({
        name: 'Joana Secretária',
        email: ' Joana@MedClinic.com ',
        password: 'SenhaForte@123',
        roles: [UserRole.SECRETARY, UserRole.ADMIN, UserRole.SECRETARY],
      });

      const saved: CreatableUser = userRepository.create.mock.calls[0][0];
      expect(saved.email).toBe('joana@medclinic.com');
      expect(saved.roles).toEqual([UserRole.SECRETARY, UserRole.ADMIN]);
      expect(saved.password).not.toBe('SenhaForte@123');
      expect(await verifyPassword('SenhaForte@123', saved.password)).toBe(true);
      expect(response).toEqual({
        id: 2,
        name: 'Joana Secretária',
        email: 'joana@medclinic.com',
        roles: [UserRole.SECRETARY, UserRole.ADMIN],
      });
    });
  });

  describe('findById', () => {
    it('lança recurso não encontrado quando o usuário não existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.findById(99)).rejects.toMatchObject({
        code: ErrorCode.RECURSO_NAO_ENCONTRADO,
      });
    });

    it('devolve o usuário com os perfis e sem a senha', async () => {
      userRepository.findById.mockResolvedValue(
        persist({
          name: 'Joana Secretária',
          email: 'joana@medclinic.com',
          password: 'hash',
          roles: [UserRole.SECRETARY],
        }),
      );

      const response = await userService.findById(2);

      expect(response).toEqual({
        id: 2,
        name: 'Joana Secretária',
        email: 'joana@medclinic.com',
        roles: [UserRole.SECRETARY],
      });
    });
  });
});
