import { Patient } from '../entities/patient.entity';

export class PatientResponseDto {
  public readonly id: number;
  public readonly name: string;
  public readonly cpf: string;
  public readonly createdAt: Date;

  constructor(patient: Patient) {
    this.id = patient.id;
    this.name = patient.name;
    this.cpf = patient.cpf;
    this.createdAt = patient.createdAt;
  }
}
