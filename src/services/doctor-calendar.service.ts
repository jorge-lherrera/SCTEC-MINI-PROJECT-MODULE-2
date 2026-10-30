import { Injectable } from '@nestjs/common';
import { CalendarQueryDto } from '../dtos/calendar-query.dto';
import { DoctorCalendarResponseDto } from '../dtos/doctor-calendar-response.dto';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { WorkShiftRepository } from '../repositories/work-shift.repository';
import {
  calendarDaysBetween,
  startOfClinicDay,
} from '../utils/clinic-time.util';

const MAX_CALENDAR_DAYS = 31;

@Injectable()
export class DoctorCalendarService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly workShiftRepository: WorkShiftRepository,
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  public async find(
    doctorId: number,
    query: CalendarQueryDto,
  ): Promise<DoctorCalendarResponseDto> {
    const daysBetween = calendarDaysBetween(query.from, query.to);

    if (daysBetween < 0) {
      throw new DomainError(
        ErrorCode.DADOS_INVALIDOS,
        'A data inicial não pode ser posterior à data final.',
      );
    }

    if (daysBetween + 1 > MAX_CALENDAR_DAYS) {
      throw new DomainError(
        ErrorCode.DADOS_INVALIDOS,
        `A agenda cobre no máximo ${MAX_CALENDAR_DAYS} dias.`,
      );
    }

    if (!(await this.doctorRepository.existsById(doctorId))) {
      throw new DomainError(
        ErrorCode.RECURSO_NAO_ENCONTRADO,
        'Médico não encontrado.',
      );
    }

    const [shifts, appointments] = await Promise.all([
      this.workShiftRepository.findByDoctorId(doctorId),
      this.appointmentRepository.findActiveForDoctorInPeriod(doctorId, {
        startsAt: startOfClinicDay(query.from),
        endsAt: startOfClinicDay(query.to, 1),
      }),
    ]);

    return new DoctorCalendarResponseDto(shifts, appointments);
  }
}
