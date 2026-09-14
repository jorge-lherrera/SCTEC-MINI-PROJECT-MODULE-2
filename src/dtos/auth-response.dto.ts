import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  public readonly token: string;
  public readonly user: UserResponseDto;

  constructor(token: string, user: UserResponseDto) {
    this.token = token;
    this.user = user;
  }
}
