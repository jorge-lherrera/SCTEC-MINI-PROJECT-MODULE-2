import { plainToInstance } from 'class-transformer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListPatientsQueryDto } from '../dtos/list-patients-query.dto';
import { Patient } from '../entities/patient.entity';
import { ErrorCode } from '../errors/error-code.enum';
import {
  CreatablePatient,
  PatientRepository,
} from '../repositories/patient.repository';
import { PatientService } from './patient.service';

const CREATED_AT = new Date('2026-10-20T14:03:11.000Z');

function createPatientRepositoryDouble() {
  return {
    create: vi.fn(),
    save: vi.fn(),
    findById: vi.fn(),
    existsByCpf: vi.fn(),
    findPage: vi.fn(),
    softDeleteById: vi.fn(),
  };
}

function buildPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 10,
    name: 'Carlos Pereira',
    cpf: '12345678901',
    createdAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  };
}

describe('PatientService', () => {
  let patientRepository: ReturnType<typeof createPatientRepositoryDouble>;
  let patientService: PatientService;

  beforeEach(() => {
    patientRepository = createPatientRepositoryDouble();
    patientService = new PatientService(
      patientRepository as unknown as PatientRepository,
    );
  });

  describe('create', () => {
    it('recusa CPF já cadastrado sem criar segundo registro', async () => {
      patientRepository.existsByCpf.mockResolvedValue(true);

      await expect(
        patientService.create({ name: 'Outro Nome', cpf: '12345678901' }),
      ).rejects.toMatchObject({ code: ErrorCode.CPF_JA_CADASTRADO });
      expect(patientRepository.create).not.toHaveBeenCalled();
    });

    it('cadastra o paciente e devolve só os campos do contrato', async () => {
      patientRepository.existsByCpf.mockResolvedValue(false);
      patientRepository.create.mockImplementation(
        async (data: CreatablePatient) => buildPatient(data),
      );

      const response = await patientService.create({
        name: 'Carlos Pereira',
        cpf: '12345678901',
      });

      expect(patientRepository.existsByCpf).toHaveBeenCalledWith(
        '12345678901',
      );
      expect(patientRepository.create).toHaveBeenCalledWith({
        name: 'Carlos Pereira',
        cpf: '12345678901',
      });
      expect(response).toEqual({
        id: 10,
        name: 'Carlos Pereira',
        cpf: '12345678901',
        createdAt: CREATED_AT,
      });
    });
  });

  describe('findPage', () => {
    it('repassa o filtro de nome e a janela da página e monta o envelope', async () => {
      patientRepository.findPage.mockResolvedValue([
        [buildPatient(), buildPatient({ id: 11, name: 'Carla Souza' })],
        23,
      ]);
      const query = plainToInstance(ListPatientsQueryDto, {
        name: 'car',
        page: '2',
        pageSize: '10',
      });

      const response = await patientService.findPage(query);

      expect(patientRepository.findPage).toHaveBeenCalledWith('car', {
        skip: 10,
        take: 10,
      });
      expect(response.meta).toEqual({
        total: 23,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      });
      expect(response.data.map((patient) => patient.id)).toEqual([10, 11]);
      expect(response.data[0]).not.toHaveProperty('deletedAt');
    });
  });

  describe('findById', () => {
    it('lança recurso não encontrado quando o paciente não existe ou foi removido', async () => {
      patientRepository.findById.mockResolvedValue(null);

      await expect(patientService.findById(99)).rejects.toMatchObject({
        code: ErrorCode.RECURSO_NAO_ENCONTRADO,
      });
    });

    it('devolve o paciente encontrado', async () => {
      patientRepository.findById.mockResolvedValue(buildPatient());

      await expect(patientService.findById(10)).resolves.toEqual({
        id: 10,
        name: 'Carlos Pereira',
        cpf: '12345678901',
        createdAt: CREATED_AT,
      });
    });
  });

  describe('update', () => {
    it('lança recurso não encontrado sem gravar nada', async () => {
      patientRepository.findById.mockResolvedValue(null);

      await expect(
        patientService.update(99, { name: 'Novo Nome' }),
      ).rejects.toMatchObject({ code: ErrorCode.RECURSO_NAO_ENCONTRADO });
      expect(patientRepository.save).not.toHaveBeenCalled();
    });

    it('altera o nome e mantém o CPF', async () => {
      patientRepository.findById.mockResolvedValue(buildPatient());
      patientRepository.save.mockImplementation(async (patient: Patient) => patient);

      const response = await patientService.update(10, {
        name: 'Carlos P. Silva',
      });

      expect(response.name).toBe('Carlos P. Silva');
      expect(response.cpf).toBe('12345678901');
    });

    it('mantém os dados quando o corpo não traz campos', async () => {
      patientRepository.findById.mockResolvedValue(buildPatient());
      patientRepository.save.mockImplementation(async (patient: Patient) => patient);

      const response = await patientService.update(10, {});

      expect(response.name).toBe('Carlos Pereira');
    });
  });

  describe('remove', () => {
    it('remove logicamente o paciente existente', async () => {
      patientRepository.softDeleteById.mockResolvedValue(true);

      await expect(patientService.remove(10)).resolves.toBeUndefined();
      expect(patientRepository.softDeleteById).toHaveBeenCalledWith(10);
    });

    it('lança recurso não encontrado quando não há paciente ativo com o id', async () => {
      patientRepository.softDeleteById.mockResolvedValue(false);

      await expect(patientService.remove(99)).rejects.toMatchObject({
        code: ErrorCode.RECURSO_NAO_ENCONTRADO,
      });
    });
  });
});
