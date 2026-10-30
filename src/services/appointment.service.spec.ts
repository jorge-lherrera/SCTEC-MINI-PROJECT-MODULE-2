import { plainToInstance } from 'class-transformer';
import { EntityManager } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionRunner } from '../database/transaction-runner';
import { ListAppointmentsQueryDto } from '../dtos/list-appointments-query.dto';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { UserRole } from '../entities/user-role.enum';
import { WorkShift } from '../entities/work-shift.entity';
import { ErrorCode } from '../errors/error-code.enum';
import {
  AppointmentRepository,
  CreatableAppointment,
} from '../repositories/appointment.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { WorkShiftRepository } from '../repositories/work-shift.repository';
import { AuthenticatedUser } from '../types/authenticated-user.interface';
import { AppointmentService } from './appointment.service';

const DOCTOR_ID = 3;
const PATIENT_ID = 10;
const TUESDAY = 2;
const TRANSACTION_MANAGER = { name: 'transaction' } as unknown as EntityManager;

function createAppointmentRepositoryDouble() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findPage: vi.fn(),
    hasActiveOverlapForDoctor: vi.fn(),
    hasActiveOverlapForPatient: vi.fn(),
  };
}

function createDoctorRepositoryDouble() {
  return { lockById: vi.fn(), findByUserId: vi.fn() };
}

function createPatientRepositoryDouble() {
  return { lockById: vi.fn() };
}

function createWorkShiftRepositoryDouble() {
  return { findByDoctorId: vi.fn() };
}

function createTransactionRunnerDouble() {
  return {
    run: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(TRANSACTION_MANAGER),
    ),
  };
}

function shift(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number,
  weekDay = TUESDAY,
): WorkShift {
  return {
    id: 1,
    doctorId: DOCTOR_ID,
    weekDay,
    startTime: `${startTime}:00`,
    endTime: `${endTime}:00`,
    slotDurationMinutes,
  } as WorkShift;
}

function request(startsAt: string) {
  return { doctorId: DOCTOR_ID, patientId: PATIENT_ID, startsAt };
}

describe('AppointmentService.create', () => {
  let appointmentRepository: ReturnType<
    typeof createAppointmentRepositoryDouble
  >;
  let doctorRepository: ReturnType<typeof createDoctorRepositoryDouble>;
  let patientRepository: ReturnType<typeof createPatientRepositoryDouble>;
  let workShiftRepository: ReturnType<typeof createWorkShiftRepositoryDouble>;
  let transactionRunner: ReturnType<typeof createTransactionRunnerDouble>;
  let appointmentService: AppointmentService;

  beforeEach(() => {
    appointmentRepository = createAppointmentRepositoryDouble();
    doctorRepository = createDoctorRepositoryDouble();
    patientRepository = createPatientRepositoryDouble();
    workShiftRepository = createWorkShiftRepositoryDouble();
    transactionRunner = createTransactionRunnerDouble();
    appointmentService = new AppointmentService(
      appointmentRepository as unknown as AppointmentRepository,
      doctorRepository as unknown as DoctorRepository,
      patientRepository as unknown as PatientRepository,
      workShiftRepository as unknown as WorkShiftRepository,
      transactionRunner as unknown as TransactionRunner,
    );

    doctorRepository.lockById.mockResolvedValue({ id: DOCTOR_ID });
    patientRepository.lockById.mockResolvedValue({ id: PATIENT_ID });
    workShiftRepository.findByDoctorId.mockResolvedValue([
      shift('08:00', '12:00', 30),
      shift('14:00', '18:00', 20),
      shift('08:00', '11:00', 40, 4),
    ]);
    appointmentRepository.hasActiveOverlapForDoctor.mockResolvedValue(false);
    appointmentRepository.hasActiveOverlapForPatient.mockResolvedValue(false);
    appointmentRepository.create.mockImplementation(
      async (data: CreatableAppointment): Promise<Appointment> =>
        ({ ...data, id: 41 }) as Appointment,
    );
  });

  it('agenda no horário da grade e calcula o fim pela duração do turno', async () => {
    const response = await appointmentService.create(
      request('2026-10-13T08:00:00-03:00'),
    );

    expect(response).toEqual({
      id: 41,
      doctorId: DOCTOR_ID,
      patientId: PATIENT_ID,
      startsAt: new Date('2026-10-13T11:00:00.000Z'),
      endsAt: new Date('2026-10-13T11:30:00.000Z'),
      status: AppointmentStatus.SCHEDULED,
    });
  });

  it('usa a duração do turno em que o horário cai', async () => {
    const response = await appointmentService.create(
      request('2026-10-13T14:40:00-03:00'),
    );

    expect(response.endsAt).toEqual(new Date('2026-10-13T18:00:00.000Z'));
  });

  it('converte o instante para o horário da clínica antes de procurar o turno', async () => {
    const response = await appointmentService.create(
      request('2026-10-13T11:30:00Z'),
    );

    expect(response.startsAt).toEqual(new Date('2026-10-13T11:30:00.000Z'));
  });

  it('faz verificação e gravação na mesma transação, com médico e paciente travados', async () => {
    await appointmentService.create(request('2026-10-13T08:00:00-03:00'));

    expect(transactionRunner.run).toHaveBeenCalledTimes(1);
    expect(doctorRepository.lockById).toHaveBeenCalledWith(
      DOCTOR_ID,
      TRANSACTION_MANAGER,
    );
    expect(patientRepository.lockById).toHaveBeenCalledWith(
      PATIENT_ID,
      TRANSACTION_MANAGER,
    );
    expect(workShiftRepository.findByDoctorId).toHaveBeenCalledWith(
      DOCTOR_ID,
      TRANSACTION_MANAGER,
    );
    expect(appointmentRepository.hasActiveOverlapForDoctor.mock.calls[0][2]).toBe(
      TRANSACTION_MANAGER,
    );
    expect(appointmentRepository.create.mock.calls[0][1]).toBe(
      TRANSACTION_MANAGER,
    );
  });

  describe('horário fora da escala', () => {
    it.each([
      ['fora de qualquer turno', '2026-10-13T13:00:00-03:00'],
      ['em dia da semana sem turno', '2026-10-12T08:00:00-03:00'],
      ['no fim exato do turno', '2026-10-13T12:00:00-03:00'],
      ['que cai em outro dia no horário da clínica', '2026-10-14T01:00:00Z'],
      ['desalinhado da grade', '2026-10-13T08:15:00-03:00'],
      ['com segundos fora da grade', '2026-10-13T09:00:30-03:00'],
      ['cuja consulta não cabe no fim do turno', '2026-10-15T10:40:00-03:00'],
    ])('recusa horário %s', async (_scenario, startsAt) => {
      await expect(appointmentService.create(request(startsAt))).rejects.toMatchObject(
        { code: ErrorCode.HORARIO_FORA_DA_ESCALA },
      );
      expect(appointmentRepository.create).not.toHaveBeenCalled();
    });

    it('recusa quando o médico não tem escala', async () => {
      workShiftRepository.findByDoctorId.mockResolvedValue([]);

      await expect(
        appointmentService.create(request('2026-10-13T08:00:00-03:00')),
      ).rejects.toMatchObject({ code: ErrorCode.HORARIO_FORA_DA_ESCALA });
    });

    it('aceita o último horário que ainda cabe no turno', async () => {
      const response = await appointmentService.create(
        request('2026-10-15T10:00:00-03:00'),
      );

      expect(response.endsAt).toEqual(new Date('2026-10-15T13:40:00.000Z'));
    });
  });

  it('recusa conflito com agendamento existente do médico', async () => {
    appointmentRepository.hasActiveOverlapForDoctor.mockResolvedValue(true);

    await expect(
      appointmentService.create(request('2026-10-13T08:00:00-03:00')),
    ).rejects.toMatchObject({ code: ErrorCode.HORARIO_INDISPONIVEL });
    expect(appointmentRepository.hasActiveOverlapForDoctor).toHaveBeenCalledWith(
      DOCTOR_ID,
      {
        startsAt: new Date('2026-10-13T11:00:00.000Z'),
        endsAt: new Date('2026-10-13T11:30:00.000Z'),
      },
      TRANSACTION_MANAGER,
    );
    expect(appointmentRepository.create).not.toHaveBeenCalled();
  });

  it('recusa conflito com agendamento existente do paciente', async () => {
    appointmentRepository.hasActiveOverlapForPatient.mockResolvedValue(true);

    await expect(
      appointmentService.create(request('2026-10-13T08:00:00-03:00')),
    ).rejects.toMatchObject({ code: ErrorCode.PACIENTE_INDISPONIVEL });
    expect(appointmentRepository.create).not.toHaveBeenCalled();
  });

  it('verifica o médico antes do paciente quando os dois estão ocupados', async () => {
    appointmentRepository.hasActiveOverlapForDoctor.mockResolvedValue(true);
    appointmentRepository.hasActiveOverlapForPatient.mockResolvedValue(true);

    await expect(
      appointmentService.create(request('2026-10-13T08:00:00-03:00')),
    ).rejects.toMatchObject({ code: ErrorCode.HORARIO_INDISPONIVEL });
  });

  it('recusa médico inexistente antes de olhar a escala', async () => {
    doctorRepository.lockById.mockResolvedValue(null);

    await expect(
      appointmentService.create(request('2026-10-13T13:00:00-03:00')),
    ).rejects.toMatchObject({ code: ErrorCode.RECURSO_NAO_ENCONTRADO });
    expect(workShiftRepository.findByDoctorId).not.toHaveBeenCalled();
  });

  it('recusa paciente inexistente ou removido', async () => {
    patientRepository.lockById.mockResolvedValue(null);

    await expect(
      appointmentService.create(request('2026-10-13T08:00:00-03:00')),
    ).rejects.toMatchObject({ code: ErrorCode.RECURSO_NAO_ENCONTRADO });
    expect(appointmentRepository.create).not.toHaveBeenCalled();
  });
});

describe('AppointmentService consultas', () => {
  const ADMIN: AuthenticatedUser = { id: 1, roles: [UserRole.ADMIN] };
  const SECRETARY: AuthenticatedUser = { id: 2, roles: [UserRole.SECRETARY] };
  const DOCTOR_USER: AuthenticatedUser = { id: 7, roles: [UserRole.DOCTOR] };
  const DOCTOR_ADMIN: AuthenticatedUser = {
    id: 8,
    roles: [UserRole.DOCTOR, UserRole.ADMIN],
  };

  let appointmentRepository: ReturnType<
    typeof createAppointmentRepositoryDouble
  >;
  let doctorRepository: ReturnType<typeof createDoctorRepositoryDouble>;
  let appointmentService: AppointmentService;

  function appointment(overrides: Partial<Appointment> = {}): Appointment {
    return {
      id: 41,
      doctorId: DOCTOR_ID,
      patientId: PATIENT_ID,
      startsAt: new Date('2026-10-13T11:00:00.000Z'),
      endsAt: new Date('2026-10-13T11:30:00.000Z'),
      status: AppointmentStatus.SCHEDULED,
      ...overrides,
    } as Appointment;
  }

  function query(values: Record<string, string> = {}): ListAppointmentsQueryDto {
    return plainToInstance(ListAppointmentsQueryDto, values);
  }

  beforeEach(() => {
    appointmentRepository = createAppointmentRepositoryDouble();
    doctorRepository = createDoctorRepositoryDouble();
    appointmentService = new AppointmentService(
      appointmentRepository as unknown as AppointmentRepository,
      doctorRepository as unknown as DoctorRepository,
      createPatientRepositoryDouble() as unknown as PatientRepository,
      createWorkShiftRepositoryDouble() as unknown as WorkShiftRepository,
      createTransactionRunnerDouble() as unknown as TransactionRunner,
    );
    appointmentRepository.findPage.mockResolvedValue([[appointment()], 1]);
    doctorRepository.findByUserId.mockResolvedValue({ id: DOCTOR_ID });
  });

  describe('findPage', () => {
    it('combina os filtros e converte as datas em dias inteiros da clínica', async () => {
      const response = await appointmentService.findPage(
        query({
          doctorId: '3',
          patientId: '10',
          status: 'scheduled',
          from: '2026-10-13',
          to: '2026-10-14',
          pageSize: '5',
          page: '2',
        }),
        SECRETARY,
      );

      expect(appointmentRepository.findPage).toHaveBeenCalledWith(
        {
          doctorId: 3,
          patientId: 10,
          status: AppointmentStatus.SCHEDULED,
          startsFrom: new Date('2026-10-13T03:00:00.000Z'),
          startsBefore: new Date('2026-10-15T03:00:00.000Z'),
        },
        { skip: 5, take: 5 },
      );
      expect(response.meta).toEqual({
        total: 1,
        page: 2,
        pageSize: 5,
        totalPages: 1,
      });
      expect(response.data[0].id).toBe(41);
    });

    it('não filtra por data quando a query não informa o período', async () => {
      await appointmentService.findPage(query(), ADMIN);

      const [filter] = appointmentRepository.findPage.mock.calls[0];
      expect(filter.startsFrom).toBeUndefined();
      expect(filter.startsBefore).toBeUndefined();
      expect(doctorRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('recusa data inicial posterior à final', async () => {
      await expect(
        appointmentService.findPage(
          query({ from: '2026-10-14', to: '2026-10-13' }),
          ADMIN,
        ),
      ).rejects.toMatchObject({ code: ErrorCode.DADOS_INVALIDOS });
    });

    it('força o filtro do próprio médico para quem é só doctor', async () => {
      await appointmentService.findPage(query({ patientId: '10' }), DOCTOR_USER);

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith(7);
      expect(appointmentRepository.findPage.mock.calls[0][0]).toMatchObject({
        doctorId: DOCTOR_ID,
        patientId: 10,
      });
    });

    it('devolve lista vazia quando o doctor pede agendamentos de outro médico', async () => {
      const response = await appointmentService.findPage(
        query({ doctorId: '99' }),
        DOCTOR_USER,
      );

      expect(response.data).toEqual([]);
      expect(response.meta.total).toBe(0);
      expect(appointmentRepository.findPage).not.toHaveBeenCalled();
    });

    it('devolve lista vazia para usuário doctor sem cadastro de médico', async () => {
      doctorRepository.findByUserId.mockResolvedValue(null);

      const response = await appointmentService.findPage(query(), DOCTOR_USER);

      expect(response.data).toEqual([]);
      expect(appointmentRepository.findPage).not.toHaveBeenCalled();
    });

    it('não restringe quem é doctor e admin ao mesmo tempo', async () => {
      await appointmentService.findPage(query({ doctorId: '99' }), DOCTOR_ADMIN);

      expect(appointmentRepository.findPage.mock.calls[0][0].doctorId).toBe(99);
    });
  });

  describe('findById', () => {
    it('lança recurso não encontrado para agendamento inexistente', async () => {
      appointmentRepository.findById.mockResolvedValue(null);

      await expect(
        appointmentService.findById(99, ADMIN),
      ).rejects.toMatchObject({ code: ErrorCode.RECURSO_NAO_ENCONTRADO });
    });

    it('devolve o agendamento para a secretaria', async () => {
      appointmentRepository.findById.mockResolvedValue(appointment());

      const response = await appointmentService.findById(41, SECRETARY);

      expect(response.id).toBe(41);
      expect(doctorRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('devolve o agendamento ao médico responsável', async () => {
      appointmentRepository.findById.mockResolvedValue(appointment());

      await expect(
        appointmentService.findById(41, DOCTOR_USER),
      ).resolves.toMatchObject({ id: 41 });
    });

    it('nega acesso ao médico que não é o do agendamento', async () => {
      appointmentRepository.findById.mockResolvedValue(
        appointment({ doctorId: 99 }),
      );

      await expect(
        appointmentService.findById(41, DOCTOR_USER),
      ).rejects.toMatchObject({ code: ErrorCode.ACESSO_NEGADO });
    });

    it('nega acesso ao usuário doctor sem cadastro de médico', async () => {
      appointmentRepository.findById.mockResolvedValue(appointment());
      doctorRepository.findByUserId.mockResolvedValue(null);

      await expect(
        appointmentService.findById(41, DOCTOR_USER),
      ).rejects.toMatchObject({ code: ErrorCode.ACESSO_NEGADO });
    });
  });
});
