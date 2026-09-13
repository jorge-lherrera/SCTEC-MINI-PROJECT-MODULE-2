import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from '../utils/jwt-payload.interface';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  public async use(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = this.extractToken(request);
    const payload = await this.verifyToken(token);

    request.user = { id: payload.sub, role: payload.role };

    next();
  }

  private extractToken(request: Request): string {
    const header = request.headers.authorization;

    if (header === undefined || !header.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    return header.slice(BEARER_PREFIX.length).trim();
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }
}
