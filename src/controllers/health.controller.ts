import { Controller, Get } from '@nestjs/common';
import { HealthResponseDto } from '../dtos/health-response.dto';

@Controller('health')
export class HealthController {
  @Get()
  public check(): HealthResponseDto {
    return new HealthResponseDto();
  }
}
