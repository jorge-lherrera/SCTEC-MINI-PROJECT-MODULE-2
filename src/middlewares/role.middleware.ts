import { NextFunction, Request, RequestHandler, Response } from 'express';
import { UserRole } from '../entities/user-role.enum';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';

export function requireRoles(...allowedRoles: UserRole[]): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const authenticatedUser = request.user;

    if (authenticatedUser === undefined) {
      throw new DomainError(
        ErrorCode.NAO_AUTENTICADO,
        'Autenticação necessária.',
      );
    }

    if (!allowedRoles.includes(authenticatedUser.role)) {
      throw new DomainError(
        ErrorCode.ACESSO_NEGADO,
        'Perfil sem permissão para este recurso.',
      );
    }

    next();
  };
}
