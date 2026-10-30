import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { WorkShift } from '../entities/work-shift.entity';
import { ErrorCode } from '../errors/error-code.enum';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { WorkShiftRepository } from '../repositories/work-shift.repository';
import { DoctorCalendarService } from './doctor-calendar.service';

const DOCTOR_ID = 3;

const TUESDAY_MORNING = {
  id: 1,
  doctorId: DOCTOR_ID,
  weekDay: 2,
  startTime: '08:00:00',
  endTime: '12:00:00',
  slotDurationMinutes: 30,
} as WorkShift;

const SCHEDULED_APPOINTMENT = {
  id: 41,
  doctorId: DOCTOR_ID,
  patientId: 10,
  startsAt: new Date('2026-10-13T11:00:00.000Z'),
  endsAt: new Date('2026-10-13T11:30:00.000Z'),
  status: AppointmentStatus.SCHEDULED,
} as Appointment;

describe('DoctorCalendarService', () => {
  let doctorRepository: { existsById: ReturnType<typeof vi.fn> };
  let workShiftRepository: { findByDoctorId: ReturnType<typeof vi.fn> };
  let appointmentRepository: {
    findActiveForDoctorInPeriod: ReturnType<typeof vi.fn>;
  };
  let doctorCalendarService: DoctorCalendarService;

  beforeEach(() => {
    doctorRepository = { existsById: vi.fn().mockResolvedValue(true) };
    workShiftRepository = {
      findByDoctorId: vi.fn().mockResolvedValue([TUESDAY_MORNING]),
    };
    appointmentRepository = {
      findActiveForDoctorInPeriod: vi
        .fn()
        .mockResolvedValue([SCHEDULED_APPOINTMENT]),
    };
    doctorCalendarService = new DoctorCalendarService(
      doctorRepository as unknown as DoctorRepository,
      workShiftRepository as unknown as WorkShiftRepository,
      appointmentRepository as unknown as AppointmentRepository,
    );
  });

  it('devolve a escala e os agendamentos ativos do período', async () => {
    const calendar = await doctorCalendarService.find(DOCTOR_ID, {
      from: '2026-10-12',
      to: '2026-10-16',
    });

    expect(calendar).toEqual({
      workSchedule: {
        shifts: [
          {
            weekDay: 2,
            startTime: '08:00',
            endTime: '12:00',
            slotDurationMinutes: 30,
          },
        ],
      },
      appointments: [
        {
          id: 41,
          doctorId: DOCTOR_ID,
          patientId: 10,
          startsAt: new Date('2026-10-13T11:00:00.000Z'),
          endsAt: new Date('2026-10-13T11:30:00.000Z'),
          status: AppointmentStatus.SCHEDULED,
        },
      ],
    });
  });

  it('cobre os dias inteiros de from a to no horário da clínica', async () => {
    await doctorCalendarService.find(DOCTOR_ID, {
      from: '2026-10-12',
      to: '2026-10-16',
    });

    expect(
      appointmentRepository.findActiveForDoctorInPeriod,
    ).toHaveBeenCalledWith(DOCTOR_ID, {
      startsAt: new Date('2026-10-12T03:00:00.000Z'),
      endsAt: new Date('2026-10-17T03:00:00.000Z'),
    });
  });

  it('devolve escala vazia para médico sem turnos', async () => {
    workShiftRepository.findByDoctorId.mockResolvedValue([]);
    appointmentRepository.findActiveForDoctorInPeriod.mockResolvedValue([]);

    await expect(
      doctorCalendarService.find(DOCTOR_ID, {
        from: '2026-10-12',
        to: '2026-10-12',
      }),
    ).resolves.toEqual({ workSchedule: { shifts: [] }, appointments: [] });
  });

  it('aceita um período de exatamente 31 dias', async () => {
    await expect(
      doctorCalendarService.find(DOCTOR_ID, {
        from: '2026-10-01',
        to: '2026-10-31',
      }),
    ).resolves.toBeDefined();
  });

  it.each([
    ['período de 32 dias', '2026-10-01', '2026-11-01'],
    ['data inicial posterior à final', '2026-10-16', '2026-10-12'],
  ])('recusa %s antes de consultar o médico', async (_case, from, to) => {
    await expect(
      doctorCalendarService.find(DOCTOR_ID, { from, to }),
    ).rejects.toMatchObject({ code: ErrorCode.DADOS_INVALIDOS });
    expect(doctorRepository.existsById).not.toHaveBeenCalled();
  });

  it('lança recurso não encontrado para médico inexistente', async () => {
    doctorRepository.existsById.mockResolvedValue(false);

    await expect(
      doctorCalendarService.find(99, { from: '2026-10-12', to: '2026-10-16' }),
    ).rejects.toMatchObject({ code: ErrorCode.RECURSO_NAO_ENCONTRADO });
    expect(workShiftRepository.findByDoctorId).not.toHaveBeenCalled();
    expect(
      appointmentRepository.findActiveForDoctorInPeriod,
    ).not.toHaveBeenCalled();
  });
});
