import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.user === undefined) {
      throw new DomainError(
        ErrorCode.NAO_AUTENTICADO,
        'Autenticação necessária.',
      );
    }

    return request.user;
  },
);
