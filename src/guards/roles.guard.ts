import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user-role.enum';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }

    const authenticatedUser = context.switchToHttp().getRequest<Request>().user;

    if (authenticatedUser === undefined) {
      throw new DomainError(
        ErrorCode.NAO_AUTENTICADO,
        'Autenticação necessária.',
      );
    }

    if (!requiredRoles.some((role) => authenticatedUser.roles.includes(role))) {
      throw new DomainError(
        ErrorCode.ACESSO_NEGADO,
        'Perfil sem permissão para este recurso.',
      );
    }

    return true;
  }
}
