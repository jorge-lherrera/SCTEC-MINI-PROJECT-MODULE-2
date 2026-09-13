import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { UserRole } from '../entities/user-role.enum';

export function requireRoles(...allowedRoles: UserRole[]): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const authenticatedUser = request.user;

    if (authenticatedUser === undefined) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!allowedRoles.includes(authenticatedUser.role)) {
      throw new ForbiddenException(
        'Insufficient permissions to access this resource',
      );
    }

    next();
  };
}
