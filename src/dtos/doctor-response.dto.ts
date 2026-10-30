import { Doctor } from '../entities/doctor.entity';
import { UserResponseDto } from './user-response.dto';

export class DoctorResponseDto {
  public readonly id: number;
  public readonly crm: string;
  public readonly user: UserResponseDto;

  constructor(doctor: Doctor) {
    this.id = doctor.id;
    this.crm = doctor.crm;
    this.user = new UserResponseDto(doctor.user);
  }
}
