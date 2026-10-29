export class ErrorResponseDto {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly message: string;
  public readonly details: string[];

  constructor(
    statusCode: number,
    error: string,
    message: string,
    details: string[],
  ) {
    this.statusCode = statusCode;
    this.error = error;
    this.message = message;
    this.details = details;
  }
}
