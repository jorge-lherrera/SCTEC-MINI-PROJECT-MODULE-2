import { MedicalRecord } from '../entities/medical-record.entity';

export class MedicalRecordResponseDto {
  public readonly id: number;
  public readonly patientId: number;
  public readonly doctorId: number;
  public readonly text: string;
  public readonly createdAt: Date;

  constructor(record: MedicalRecord) {
    this.id = record.id;
    this.patientId = record.patientId;
    this.doctorId = record.doctorId;
    this.text = record.text;
    this.createdAt = record.createdAt;
  }
}
