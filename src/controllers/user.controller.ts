import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UserRole } from '../entities/user-role.enum';
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

  @Post()
  @Roles(UserRole.ADMIN)
  public async create(@Body() data: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(data);
  }
}
