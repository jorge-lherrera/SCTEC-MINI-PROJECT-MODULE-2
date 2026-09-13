import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../dtos/error-response.dto';

interface ResolvedMessage {
  message: string;
  details: string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const statusCode = this.resolveStatusCode(exception);
    const resolved = this.resolveMessage(exception);

    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled failure on ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response
      .status(statusCode)
      .json(
        new ErrorResponseDto(
          statusCode,
          resolved.message,
          resolved.details,
          request.originalUrl,
        ),
      );
  }

  private resolveStatusCode(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: unknown): ResolvedMessage {
    if (!(exception instanceof HttpException)) {
      return { message: 'Internal server error', details: [] };
    }

    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { message: payload, details: [] };
    }

    const rawMessage = (payload as Record<string, unknown>).message;

    if (Array.isArray(rawMessage)) {
      return {
        message: 'Validation failed',
        details: rawMessage.map((entry) => String(entry)),
      };
    }

    if (typeof rawMessage === 'string') {
      return { message: rawMessage, details: [] };
    }

    return { message: exception.message, details: [] };
  }
}
