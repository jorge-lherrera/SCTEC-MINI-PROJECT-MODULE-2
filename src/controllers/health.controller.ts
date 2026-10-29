import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { HealthResponseDto } from '../dtos/health-response.dto';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  public check(): HealthResponseDto {
    return new HealthResponseDto();
  }
}
