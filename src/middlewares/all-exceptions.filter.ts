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
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';

const INTERNAL_ERROR_CODE = 'ERRO_INTERNO';
const INTERNAL_ERROR_MESSAGE = 'Erro interno do servidor.';

const STATUS_BY_ERROR_CODE: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.DADOS_INVALIDOS]: HttpStatus.BAD_REQUEST,
  [ErrorCode.NAO_AUTENTICADO]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.CREDENCIAIS_INVALIDAS]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.ACESSO_NEGADO]: HttpStatus.FORBIDDEN,
  [ErrorCode.RECURSO_NAO_ENCONTRADO]: HttpStatus.NOT_FOUND,
  [ErrorCode.EMAIL_JA_CADASTRADO]: HttpStatus.CONFLICT,
  [ErrorCode.CPF_JA_CADASTRADO]: HttpStatus.CONFLICT,
  [ErrorCode.CRM_JA_CADASTRADO]: HttpStatus.CONFLICT,
  [ErrorCode.HORARIO_INDISPONIVEL]: HttpStatus.CONFLICT,
  [ErrorCode.PACIENTE_INDISPONIVEL]: HttpStatus.CONFLICT,
  [ErrorCode.HORARIO_FORA_DA_ESCALA]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorCode.TRANSICAO_INVALIDA]: HttpStatus.UNPROCESSABLE_ENTITY,
};

type FrameworkErrorCode =
  | ErrorCode.DADOS_INVALIDOS
  | ErrorCode.NAO_AUTENTICADO
  | ErrorCode.ACESSO_NEGADO
  | ErrorCode.RECURSO_NAO_ENCONTRADO;

const FRAMEWORK_ERROR_MESSAGES: Record<FrameworkErrorCode, string> = {
  [ErrorCode.DADOS_INVALIDOS]: 'Dados inválidos.',
  [ErrorCode.NAO_AUTENTICADO]: 'Autenticação necessária.',
  [ErrorCode.ACESSO_NEGADO]: 'Acesso negado.',
  [ErrorCode.RECURSO_NAO_ENCONTRADO]: 'Recurso não encontrado.',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const errorResponse = this.toErrorResponse(
      exception,
      context.getRequest<Request>(),
    );

    context
      .getResponse<Response>()
      .status(errorResponse.statusCode)
      .json(errorResponse);
  }

  private toErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponseDto {
    if (exception instanceof DomainError) {
      return new ErrorResponseDto(
        STATUS_BY_ERROR_CODE[exception.code],
        exception.code,
        exception.message,
        [],
      );
    }

    if (
      exception instanceof HttpException &&
      exception.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      const code = this.resolveFrameworkErrorCode(exception.getStatus());

      return new ErrorResponseDto(
        STATUS_BY_ERROR_CODE[code],
        code,
        FRAMEWORK_ERROR_MESSAGES[code],
        this.extractDetails(exception),
      );
    }

    this.logger.error(
      `Unhandled failure on ${request.method} ${request.originalUrl}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return new ErrorResponseDto(
      HttpStatus.INTERNAL_SERVER_ERROR,
      INTERNAL_ERROR_CODE,
      INTERNAL_ERROR_MESSAGE,
      [],
    );
  }

  private resolveFrameworkErrorCode(status: number): FrameworkErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.NAO_AUTENTICADO;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.ACESSO_NEGADO;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RECURSO_NAO_ENCONTRADO;
      default:
        return ErrorCode.DADOS_INVALIDOS;
    }
  }

  private extractDetails(exception: HttpException): string[] {
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return [payload];
    }

    const message = (payload as Record<string, unknown>).message;

    if (Array.isArray(message)) {
      return message.map((entry) => String(entry));
    }

    return typeof message === 'string' ? [message] : [];
  }
}
