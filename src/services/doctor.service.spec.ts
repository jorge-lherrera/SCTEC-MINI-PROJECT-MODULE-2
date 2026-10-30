import { plainToInstance } from 'class-transformer';
import { EntityManager } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionRunner } from '../database/transaction-runner';
import { NameSearchQueryDto } from '../dtos/name-search-query.dto';
import { Doctor } from '../entities/doctor.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import {
  CreatableDoctor,
  DoctorRepository,
} from '../repositories/doctor.repository';
import { CreatableUser, UserRepository } from '../repositories/user.repository';
import { verifyPassword } from '../utils/hash.util';
import { DoctorService } from './doctor.service';

const TRANSACTION_MANAGER = { name: 'transaction' } as unknown as EntityManager;
const CREATED_AT = new Date('2026-10-20T14:03:11.000Z');

const NEW_DOCTOR = {
  name: 'Dra. Helena Souza',
  email: ' Helena@MedClinic.com ',
  password: 'SenhaForte@123',
  crm: 'crm-sc-54321',
};

function createUserRepositoryDouble() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    existsByEmail: vi.fn(),
  };
}

function createDoctorRepositoryDouble() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    existsByCrm: vi.fn(),
    findPage: vi.fn(),
  };
}

function createTransactionRunnerDouble() {
  return {
    run: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(TRANSACTION_MANAGER),
    ),
  };
}

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    name: 'Dra. Helena Souza',
    email: 'helena@medclinic.com',
    password: 'hash',
    roles: [UserRole.DOCTOR],
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function buildDoctor(overrides: Partial<Doctor> = {}): Doctor {
  return {
    id: 3,
    crm: 'CRM-SC-54321',
    user: buildUser(),
    createdAt: CREATED_AT,
    ...overrides,
  };
}

describe('DoctorService', () => {
  let userRepository: ReturnType<typeof createUserRepositoryDouble>;
  let doctorRepository: ReturnType<typeof createDoctorRepositoryDouble>;
  let transactionRunner: ReturnType<typeof createTransactionRunnerDouble>;
  let doctorService: DoctorService;

  beforeEach(() => {
    userRepository = createUserRepositoryDouble();
    doctorRepository = createDoctorRepositoryDouble();
    transactionRunner = createTransactionRunnerDouble();
    doctorService = new DoctorService(
      doctorRepository as unknown as DoctorRepository,
      userRepository as unknown as UserRepository,
      transactionRunner as unknown as TransactionRunner,
    );
  });

  describe('create', () => {
    it('recusa e-mail já cadastrado sem abrir a transação', async () => {
      userRepository.existsByEmail.mockResolvedValue(true);

      await expect(doctorService.create(NEW_DOCTOR)).rejects.toMatchObject({
        code: ErrorCode.EMAIL_JA_CADASTRADO,
      });
      expect(transactionRunner.run).not.toHaveBeenCalled();
    });

    it('recusa CRM já cadastrado sem criar o usuário', async () => {
      userRepository.existsByEmail.mockResolvedValue(false);
      doctorRepository.existsByCrm.mockResolvedValue(true);

      await expect(doctorService.create(NEW_DOCTOR)).rejects.toMatchObject({
        code: ErrorCode.CRM_JA_CADASTRADO,
      });
      expect(doctorRepository.existsByCrm).toHaveBeenCalledWith('CRM-SC-54321');
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(transactionRunner.run).not.toHaveBeenCalled();
    });

    it('cria usuário doctor e médico na mesma transação', async () => {
      userRepository.existsByEmail.mockResolvedValue(false);
      doctorRepository.existsByCrm.mockResolvedValue(false);
      userRepository.create.mockImplementation(async (data: CreatableUser) =>
        buildUser({ ...data, id: 7 }),
      );
      doctorRepository.create.mockImplementation(
        async (data: CreatableDoctor) => buildDoctor(data),
      );

      const response = await doctorService.create(NEW_DOCTOR);

      expect(transactionRunner.run).toHaveBeenCalledTimes(1);
      const [userData, userManager] = userRepository.create.mock.calls[0];
      const [doctorData, doctorManager] = doctorRepository.create.mock.calls[0];
      expect(userManager).toBe(TRANSACTION_MANAGER);
      expect(doctorManager).toBe(TRANSACTION_MANAGER);
      expect(userData.email).toBe('helena@medclinic.com');
      expect(userData.roles).toEqual([UserRole.DOCTOR]);
      expect(await verifyPassword('SenhaForte@123', userData.password)).toBe(
        true,
      );
      expect(doctorData.crm).toBe('CRM-SC-54321');
      expect(doctorData.user.id).toBe(7);
      expect(response).toEqual({
        id: 3,
        crm: 'CRM-SC-54321',
        user: {
          id: 7,
          name: 'Dra. Helena Souza',
          email: 'helena@medclinic.com',
          roles: [UserRole.DOCTOR],
        },
      });
    });

    it('propaga a falha do CRM de dentro da transação para que o usuário seja desfeito', async () => {
      userRepository.existsByEmail.mockResolvedValue(false);
      doctorRepository.existsByCrm.mockResolvedValue(false);
      userRepository.create.mockResolvedValue(buildUser());
      const conflict = new DomainError(
        ErrorCode.CRM_JA_CADASTRADO,
        'CRM já cadastrado.',
      );
      doctorRepository.create.mockRejectedValue(conflict);

      await expect(doctorService.create(NEW_DOCTOR)).rejects.toBe(conflict);
      await expect(transactionRunner.run.mock.results[0].value).rejects.toBe(
        conflict,
      );
      expect(userRepository.create.mock.calls[0][1]).toBe(TRANSACTION_MANAGER);
    });
  });

  describe('findPage', () => {
    it('repassa filtro e janela e monta o envelope', async () => {
      doctorRepository.findPage.mockResolvedValue([[buildDoctor()], 1]);
      const query = plainToInstance(NameSearchQueryDto, {
        name: 'helena',
        pageSize: '5',
      });

      const response = await doctorService.findPage(query);

      expect(doctorRepository.findPage).toHaveBeenCalledWith('helena', {
        skip: 0,
        take: 5,
      });
      expect(response.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 5,
        totalPages: 1,
      });
      expect(response.data[0].user).not.toHaveProperty('password');
    });
  });

  describe('findById', () => {
    it('lança recurso não encontrado quando o médico não existe', async () => {
      doctorRepository.findById.mockResolvedValue(null);

      await expect(doctorService.findById(99)).rejects.toMatchObject({
        code: ErrorCode.RECURSO_NAO_ENCONTRADO,
      });
    });

    it('devolve o médico com o usuário de acesso', async () => {
      doctorRepository.findById.mockResolvedValue(buildDoctor());

      const response = await doctorService.findById(3);

      expect(response.id).toBe(3);
      expect(response.user.roles).toEqual([UserRole.DOCTOR]);
    });
  });
});
