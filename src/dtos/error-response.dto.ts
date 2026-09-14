export class ErrorResponseDto {
  public readonly statusCode: number;
  public readonly message: string;
  public readonly details: string[];
  public readonly path: string;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    details: string[],
    path: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    this.path = path;
    this.timestamp = new Date().toISOString();
  }
}
