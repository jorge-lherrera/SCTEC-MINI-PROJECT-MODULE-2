import { plainToInstance } from 'class-transformer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { MedicalRecord } from '../entities/medical-record.entity';
import { UserRole } from '../entities/user-role.enum';
import { ErrorCode } from '../errors/error-code.enum';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import {
  CreatableMedicalRecord,
  MedicalRecordRepository,
} from '../repositories/medical-record.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { AuthenticatedUser } from '../types/authenticated-user.interface';
import { MedicalRecordService } from './medical-record.service';

const PATIENT_ID = 10;
const DOCTOR_ID = 3;
const CREATED_AT = new Date('2026-10-13T11:25:00.000Z');
const TEXT = 'Paciente relata dor lombar há duas semanas. Solicitado raio-X.';

const ADMIN: AuthenticatedUser = { id: 1, roles: [UserRole.ADMIN] };
const SECRETARY: AuthenticatedUser = { id: 2, roles: [UserRole.SECRETARY] };
const DOCTOR_USER: AuthenticatedUser = { id: 7, roles: [UserRole.DOCTOR] };
const DOCTOR_ADMIN: AuthenticatedUser = {
  id: 8,
  roles: [UserRole.DOCTOR, UserRole.ADMIN],
};

function record(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: 5,
    patientId: PATIENT_ID,
    doctorId: DOCTOR_ID,
    text: TEXT,
    createdAt: CREATED_AT,
    ...overrides,
  } as MedicalRecord;
}

describe('MedicalRecordService', () => {
  let medicalRecordRepository: {
    create: ReturnType<typeof vi.fn>;
    findPageByPatient: ReturnType<typeof vi.fn>;
  };
  let patientRepository: { existsById: ReturnType<typeof vi.fn> };
  let doctorRepository: { findByUserId: ReturnType<typeof vi.fn> };
  let appointmentRepository: {
    existsForDoctorAndPatient: ReturnType<typeof vi.fn>;
  };
  let medicalRecordService: MedicalRecordService;

  beforeEach(() => {
    medicalRecordRepository = {
      create: vi.fn(
        async (data: CreatableMedicalRecord): Promise<MedicalRecord> =>
          record({ ...data }),
      ),
      findPageByPatient: vi.fn().mockResolvedValue([[record()], 1]),
    };
    patientRepository = { existsById: vi.fn().mockResolvedValue(true) };
    doctorRepository = {
      findByUserId: vi.fn().mockResolvedValue({ id: DOCTOR_ID }),
    };
    appointmentRepository = {
      existsForDoctorAndPatient: vi.fn().mockResolvedValue(true),
    };
    medicalRecordService = new MedicalRecordService(
      medicalRecordRepository as unknown as MedicalRecordRepository,
      patientRepository as unknown as PatientRepository,
      doctorRepository as unknown as DoctorRepository,
      appointmentRepository as unknown as AppointmentRepository,
    );
  });

  describe('create', () => {
    it('médico com vínculo escreve no prontuário como autor', async () => {
      const response = await medicalRecordService.create(
        PATIENT_ID,
        { text: TEXT },
        DOCTOR_USER,
      );

      expect(response).toEqual({
        id: 5,
        patientId: PATIENT_ID,
        doctorId: DOCTOR_ID,
        text: TEXT,
        createdAt: CREATED_AT,
      });
      expect(medicalRecordRepository.create).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        doctorId: DOCTOR_ID,
        text: TEXT,
      });
    });

    it('define o vínculo por consulta em andamento ou concluída', async () => {
      await medicalRecordService.create(PATIENT_ID, { text: TEXT }, DOCTOR_USER);

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith(7);
      expect(
        appointmentRepository.existsForDoctorAndPatient,
      ).toHaveBeenCalledWith(DOCTOR_ID, PATIENT_ID, [
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.DONE,
      ]);
    });

    it('ignora o doctorId enviado no corpo', async () => {
      await medicalRecordService.create(
        PATIENT_ID,
        { text: TEXT, doctorId: 99 },
        DOCTOR_USER,
      );

      expect(medicalRecordRepository.create.mock.calls[0][0].doctorId).toBe(
        DOCTOR_ID,
      );
    });

    it('nega a escrita ao médico sem vínculo com o paciente', async () => {
      appointmentRepository.existsForDoctorAndPatient.mockResolvedValue(false);

      await expect(
        medicalRecordService.create(PATIENT_ID, { text: TEXT }, DOCTOR_USER),
      ).rejects.toMatchObject({ code: ErrorCode.ACESSO_NEGADO });
      expect(medicalRecordRepository.create).not.toHaveBeenCalled();
    });

    it('nega a escrita ao usuário doctor sem cadastro de médico', async () => {
      doctorRepository.findByUserId.mockResolvedValue(null);

      await expect(
        medicalRecordService.create(PATIENT_ID, { text: TEXT }, DOCTOR_USER),
      ).rejects.toMatchObject({ code: ErrorCode.ACESSO_NEGADO });
      expect(
        appointmentRepository.existsForDoctorAndPatient,
      ).not.toHaveBeenCalled();
    });

    it.each([ADMIN, SECRETARY])(
      'nega a escrita a quem não é médico (%o)',
      async (user) => {
        await expect(
          medicalRecordService.create(PATIENT_ID, { text: TEXT }, user),
        ).rejects.toMatchObject({ code: ErrorCode.ACESSO_NEGADO });
        expect(doctorRepository.findByUserId).not.toHaveBeenCalled();
      },
    );

    it('nega a escrita a quem é doctor e admin sem vínculo', async () => {
      appointmentRepository.existsForDoctorAndPatient.mockResolvedValue(false);

      await expect(
        medicalRecordService.create(PATIENT_ID, { text: TEXT }, DOCTOR_ADMIN),
      ).rejects.toMatchObject({ code: ErrorCode.ACESSO_NEGADO });
    });

    it('lança recurso não encontrado para paciente inexistente', async () => {
      patientRepository.existsById.mockResolvedValue(false);

      await expect(
        medicalRecordService.create(99, { text: TEXT }, DOCTOR_USER),
      ).rejects.toMatchObject({ code: ErrorCode.RECURSO_NAO_ENCONTRADO });
      expect(doctorRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('findPage', () => {
    const query = plainToInstance(PaginationQueryDto, {
      page: '2',
      pageSize: '5',
    });

    it('médico com vínculo lê o prontuário paginado', async () => {
      const response = await medicalRecordService.findPage(
        PATIENT_ID,
        query,
        DOCTOR_USER,
      );

      expect(medicalRecordRepository.findPageByPatient).toHaveBeenCalledWith(
        PATIENT_ID,
        { skip: 5, take: 5 },
      );
      expect(response.data).toEqual([
        {
          id: 5,
          patientId: PATIENT_ID,
          doctorId: DOCTOR_ID,
          text: TEXT,
          createdAt: CREATED_AT,
        },
      ]);
      expect(response.meta).toEqual({
        total: 1,
        page: 2,
        pageSize: 5,
        totalPages: 1,
      });
    });

    it('admin lê o prontuário para auditoria sem precisar de vínculo', async () => {
      await medicalRecordService.findPage(PATIENT_ID, query, ADMIN);

      expect(doctorRepository.findByUserId).not.toHaveBeenCalled();
      expect(medicalRecordRepository.findPageByPatient).toHaveBeenCalled();
    });

    it('nega a leitura ao médico sem vínculo', async () => {
      appointmentRepository.existsForDoctorAndPatient.mockResolvedValue(false);

      await expect(
        medicalRecordService.findPage(PATIENT_ID, query, DOCTOR_USER),
      ).rejects.toMatchObject({ code: ErrorCode.ACESSO_NEGADO });
      expect(medicalRecordRepository.findPageByPatient).not.toHaveBeenCalled();
    });

    it('nega a leitura à secretaria', async () => {
      await expect(
        medicalRecordService.findPage(PATIENT_ID, query, SECRETARY),
      ).rejects.toMatchObject({ code: ErrorCode.ACESSO_NEGADO });
    });

    it('lança recurso não encontrado para paciente inexistente', async () => {
      patientRepository.existsById.mockResolvedValue(false);

      await expect(
        medicalRecordService.findPage(99, query, ADMIN),
      ).rejects.toMatchObject({ code: ErrorCode.RECURSO_NAO_ENCONTRADO });
    });
  });
});
