import { EntityManager } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionRunner } from '../database/transaction-runner';
import { WorkShiftDto } from '../dtos/work-schedule.dto';
import { Doctor } from '../entities/doctor.entity';
import { WorkShift } from '../entities/work-shift.entity';
import { ErrorCode } from '../errors/error-code.enum';
import { DoctorRepository } from '../repositories/doctor.repository';
import {
  CreatableWorkShift,
  WorkShiftRepository,
} from '../repositories/work-shift.repository';
import { WorkScheduleService } from './work-schedule.service';

const DOCTOR_ID = 3;
const TRANSACTION_MANAGER = { name: 'transaction' } as unknown as EntityManager;

function createDoctorRepositoryDouble() {
  return {
    lockById: vi.fn(),
    existsById: vi.fn(),
  };
}

function createWorkShiftRepositoryDouble() {
  return {
    replaceForDoctor: vi.fn(),
    findByDoctorId: vi.fn(),
  };
}

function createTransactionRunnerDouble() {
  return {
    run: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(TRANSACTION_MANAGER),
    ),
  };
}

function shift(
  weekDay: number,
  startTime: string,
  endTime: string,
  slotDurationMinutes = 30,
): WorkShiftDto {
  return { weekDay, startTime, endTime, slotDurationMinutes };
}

function persisted(data: CreatableWorkShift, id: number): WorkShift {
  return {
    ...data,
    id,
    doctorId: DOCTOR_ID,
    doctor: { id: DOCTOR_ID } as Doctor,
    startTime: `${data.startTime}:00`,
    endTime: `${data.endTime}:00`,
  };
}

describe('WorkScheduleService', () => {
  let doctorRepository: ReturnType<typeof createDoctorRepositoryDouble>;
  let workShiftRepository: ReturnType<typeof createWorkShiftRepositoryDouble>;
  let transactionRunner: ReturnType<typeof createTransactionRunnerDouble>;
  let workScheduleService: WorkScheduleService;

  beforeEach(() => {
    doctorRepository = createDoctorRepositoryDouble();
    workShiftRepository = createWorkShiftRepositoryDouble();
    transactionRunner = createTransactionRunnerDouble();
    workScheduleService = new WorkScheduleService(
      doctorRepository as unknown as DoctorRepository,
      workShiftRepository as unknown as WorkShiftRepository,
      transactionRunner as unknown as TransactionRunner,
    );
    doctorRepository.lockById.mockResolvedValue({ id: DOCTOR_ID });
    workShiftRepository.replaceForDoctor.mockImplementation(
      async (_doctorId: number, shifts: CreatableWorkShift[]) =>
        shifts.map((data, index) => persisted(data, index + 1)),
    );
  });

  describe('replace', () => {
    it('rejeita turnos sobrepostos no mesmo dia da semana', async () => {
      await expect(
        workScheduleService.replace(DOCTOR_ID, {
          shifts: [shift(2, '08:00', '12:00'), shift(2, '11:30', '14:00')],
        }),
      ).rejects.toMatchObject({ code: ErrorCode.DADOS_INVALIDOS });
      expect(transactionRunner.run).not.toHaveBeenCalled();
    });

    it('rejeita turno contido em outro do mesmo dia', async () => {
      await expect(
        workScheduleService.replace(DOCTOR_ID, {
          shifts: [shift(3, '08:00', '18:00'), shift(3, '10:00', '11:00')],
        }),
      ).rejects.toMatchObject({ code: ErrorCode.DADOS_INVALIDOS });
    });

    it('aceita turnos encostados no mesmo dia', async () => {
      const response = await workScheduleService.replace(DOCTOR_ID, {
        shifts: [shift(2, '12:00', '18:00', 20), shift(2, '08:00', '12:00')],
      });

      expect(response.shifts).toEqual([
        shift(2, '08:00', '12:00'),
        shift(2, '12:00', '18:00', 20),
      ]);
    });

    it('aceita o mesmo horário em dias diferentes', async () => {
      const response = await workScheduleService.replace(DOCTOR_ID, {
        shifts: [shift(5, '08:00', '12:00'), shift(1, '08:00', '12:00')],
      });

      expect(response.shifts.map((item) => item.weekDay)).toEqual([1, 5]);
    });

    it.each([
      ['termina antes de começar', '14:00', '12:00'],
      ['começa e termina no mesmo horário', '12:00', '12:00'],
    ])('rejeita turno que %s', async (_label, startTime, endTime) => {
      await expect(
        workScheduleService.replace(DOCTOR_ID, {
          shifts: [shift(1, startTime, endTime)],
        }),
      ).rejects.toMatchObject({ code: ErrorCode.DADOS_INVALIDOS });
      expect(transactionRunner.run).not.toHaveBeenCalled();
    });

    it('substitui a escala inteira dentro da transação com o médico travado', async () => {
      await workScheduleService.replace(DOCTOR_ID, {
        shifts: [shift(4, '08:00', '11:00')],
      });

      expect(doctorRepository.lockById).toHaveBeenCalledWith(
        DOCTOR_ID,
        TRANSACTION_MANAGER,
      );
      expect(workShiftRepository.replaceForDoctor).toHaveBeenCalledWith(
        DOCTOR_ID,
        [shift(4, '08:00', '11:00')],
        TRANSACTION_MANAGER,
      );
    });

    it('apaga a escala quando recebe lista vazia', async () => {
      const response = await workScheduleService.replace(DOCTOR_ID, {
        shifts: [],
      });

      expect(workShiftRepository.replaceForDoctor).toHaveBeenCalledWith(
        DOCTOR_ID,
        [],
        TRANSACTION_MANAGER,
      );
      expect(response).toEqual({ shifts: [] });
    });

    it('lança recurso não encontrado sem gravar quando o médico não existe', async () => {
      doctorRepository.lockById.mockResolvedValue(null);

      await expect(
        workScheduleService.replace(99, { shifts: [] }),
      ).rejects.toMatchObject({ code: ErrorCode.RECURSO_NAO_ENCONTRADO });
      expect(workShiftRepository.replaceForDoctor).not.toHaveBeenCalled();
    });
  });

  describe('find', () => {
    it('lança recurso não encontrado quando o médico não existe', async () => {
      doctorRepository.existsById.mockResolvedValue(false);

      await expect(workScheduleService.find(99)).rejects.toMatchObject({
        code: ErrorCode.RECURSO_NAO_ENCONTRADO,
      });
    });

    it('devolve lista vazia para médico sem escala', async () => {
      doctorRepository.existsById.mockResolvedValue(true);
      workShiftRepository.findByDoctorId.mockResolvedValue([]);

      await expect(workScheduleService.find(DOCTOR_ID)).resolves.toEqual({
        shifts: [],
      });
    });

    it('devolve as horas no formato HH:MM', async () => {
      doctorRepository.existsById.mockResolvedValue(true);
      workShiftRepository.findByDoctorId.mockResolvedValue([
        persisted(shift(2, '14:00', '18:00', 20), 2),
      ]);

      await expect(workScheduleService.find(DOCTOR_ID)).resolves.toEqual({
        shifts: [shift(2, '14:00', '18:00', 20)],
      });
    });
  });
});
