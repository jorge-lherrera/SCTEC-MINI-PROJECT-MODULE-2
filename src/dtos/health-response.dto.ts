export class HealthResponseDto {
  public readonly status: string;

  constructor() {
    this.status = 'ok';
  }
}
