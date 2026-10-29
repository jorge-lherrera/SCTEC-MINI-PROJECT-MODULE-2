import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DomainError } from '../errors/domain.error';
import { ErrorCode } from '../errors/error-code.enum';
import { AuthenticatedUser } from '../types/authenticated-user.interface';
import { JwtPayload } from '../utils/jwt-payload.interface';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic === true) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const payload = await this.verifyToken(this.extractToken(request));

    request.user = this.toAuthenticatedUser(payload);

    return true;
  }

  private extractToken(request: Request): string {
    const header = request.headers.authorization;

    if (header === undefined || !header.startsWith(BEARER_PREFIX)) {
      throw new DomainError(
        ErrorCode.NAO_AUTENTICADO,
        'Token de autenticação ausente.',
      );
    }

    return header.slice(BEARER_PREFIX.length).trim();
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw this.invalidTokenError();
    }
  }

  private toAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
    const id = Number(payload.sub);

    if (!Number.isInteger(id) || !Array.isArray(payload.roles)) {
      throw this.invalidTokenError();
    }

    return { id, roles: payload.roles };
  }

  private invalidTokenError(): DomainError {
    return new DomainError(
      ErrorCode.NAO_AUTENTICADO,
      'Token de autenticação inválido ou expirado.',
    );
  }
}
