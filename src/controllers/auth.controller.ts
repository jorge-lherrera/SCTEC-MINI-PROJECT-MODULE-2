import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginDto } from '../dtos/login.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  public async register(
    @Body() data: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.register(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() data: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(data);
  }
}
