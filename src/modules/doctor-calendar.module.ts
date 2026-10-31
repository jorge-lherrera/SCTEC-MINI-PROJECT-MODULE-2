import { Module } from '@nestjs/common';
import { DoctorCalendarController } from '../controllers/doctor-calendar.controller';
import { DoctorCalendarService } from '../services/doctor-calendar.service';
import { AppointmentModule } from './appointment.module';
import { DoctorModule } from './doctor.module';
import { WorkScheduleModule } from './work-schedule.module';

@Module({
  imports: [DoctorModule, WorkScheduleModule, AppointmentModule],
  controllers: [DoctorCalendarController],
  providers: [DoctorCalendarService],
})
export class DoctorCalendarModule {}
