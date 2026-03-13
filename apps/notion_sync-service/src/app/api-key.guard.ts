import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_API_KEY } from './webhook/skip-api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipApiKey = this.reflector.getAllAndOverride<boolean>(SKIP_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipApiKey) return true;

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const expectedKey = process.env.NOTION_SYNC_API_KEY;

    if (!expectedKey) {
      return true;
    }

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
