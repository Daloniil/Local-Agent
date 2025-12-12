import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
// import { Reflector } from '@nestjs/core'; // Remove Reflector import
// import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator'; // Remove IS_PUBLIC_KEY import

@Injectable()
export class AuthGuard implements CanActivate {
  // constructor(private configService: ConfigService, private reflector: Reflector) {} // Remove Reflector
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // Remove isPublic logic
    // const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);
    // if (isPublic) {
    //   return true;
    // }

    const request = context.switchToHttp().getRequest();

    // Remove explicit exclusion for /config
    // if (request.url === '/config' || request.url === '/api/config') {
    //   return true;
    // }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token not found");
    }

    const token = authHeader.split(" ")[1];
    const apiToken = this.configService.get<string>("API_TOKEN");

    if (token !== apiToken) {
      throw new UnauthorizedException("Invalid API token");
    }

    return true;
  }
}
