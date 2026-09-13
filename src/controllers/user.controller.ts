import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserService } from '../services/user.service';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  public async getAuthenticatedUser(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.userService.findById(authenticatedUser.id);
  }
}
