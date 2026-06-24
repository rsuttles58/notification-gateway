import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const provided = req.header('x-api-key');
    if (!provided || provided !== this.config.get<string>('apiKey')) {
      throw new UnauthorizedException('Invalid or missing x-api-key header');
    }
    return true;
  }
}
