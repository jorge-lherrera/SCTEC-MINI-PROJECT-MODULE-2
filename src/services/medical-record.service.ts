import { Injectable } from '@nestjs/common';
import { CreateMedicalRecordDto } from '../dtos/create-medical-record.dto';
import { MedicalRecordResponseDto } from '../dtos/medical-record-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { AppointmentStatus } from '../entities/appointment-status.enum';
import { UserRole } from '../entities/user-role.enum';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { MedicalRecordRepository } from '../repositories/medical-record.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { AuthenticatedUser } from '../types/authenticated-user.interface';
import { toPageWindow } from '../utils/pagination.util';

const CARE_RELATIONSHIP_STATUSES = [
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.DONE,
];

@Injectable()
export class MedicalRecordService {
  constructor(
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly patientRepository: PatientRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  public async create(
    patientId: number,
    data: CreateMedicalRecordDto,
    user: AuthenticatedUser,
  ): Promise<MedicalRecordResponseDto> {
    await this.assertPatientExists(patientId);

    const doctorId = await this.findAttendingDoctorId(patientId, user);

    if (doctorId === null) {
      throw new DomainError(
        ErrorCode.ACESSO_NEGADO,
        'Só um médico que atendeu o paciente pode escrever no prontuário.',
      );
    }

    return new MedicalRecordResponseDto(
      await this.medicalRecordRepository.create({
        patientId,
        doctorId,
        text: data.text,
      }),
    );
  }

  public async findPage(
    patientId: number,
    query: PaginationQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResponseDto<MedicalRecordResponseDto>> {
    await this.assertPatientExists(patientId);

    if (
      !user.roles.includes(UserRole.ADMIN) &&
      (await this.findAttendingDoctorId(patientId, user)) === null
    ) {
      throw new DomainError(
        ErrorCode.ACESSO_NEGADO,
        'Só a administração ou um médico que atendeu o paciente pode ler o prontuário.',
      );
    }

    const [records, total] =
      await this.medicalRecordRepository.findPageByPatient(
        patientId,
        toPageWindow(query),
      );

    return new PaginatedResponseDto(
      records.map((record) => new MedicalRecordResponseDto(record)),
      total,
      query,
    );
  }

  private async assertPatientExists(patientId: number): Promise<void> {
    if (!(await this.patientRepository.existsById(patientId))) {
      throw new DomainError(
        ErrorCode.RECURSO_NAO_ENCONTRADO,
        'Paciente não encontrado.',
      );
    }
  }

  private async findAttendingDoctorId(
    patientId: number,
    user: AuthenticatedUser,
  ): Promise<number | null> {
    if (!user.roles.includes(UserRole.DOCTOR)) {
      return null;
    }

    const doctor = await this.doctorRepository.findByUserId(user.id);

    if (
      doctor === null ||
      !(await this.appointmentRepository.existsForDoctorAndPatient(
        doctor.id,
        patientId,
        CARE_RELATIONSHIP_STATUSES,
      ))
    ) {
      return null;
    }

    return doctor.id;
  }
}
