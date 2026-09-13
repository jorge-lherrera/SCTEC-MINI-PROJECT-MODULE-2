import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AdminPingResponseDto } from '../dtos/admin-ping-response.dto';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

@Controller('admin')
export class AdminController {
  @Get('ping')
  public ping(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): AdminPingResponseDto {
    return new AdminPingResponseDto(authenticatedUser.role);
  }
}
