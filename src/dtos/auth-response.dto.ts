export class AuthResponseDto {
  public readonly accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}
