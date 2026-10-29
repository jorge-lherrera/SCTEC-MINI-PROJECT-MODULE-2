import { ErrorCode } from './error-code.enum';

export class DomainError extends Error {
  public readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = DomainError.name;
    this.code = code;
  }
}
