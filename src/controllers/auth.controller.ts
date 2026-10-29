import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../services/auth.service';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() data: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(data);
  }
}
