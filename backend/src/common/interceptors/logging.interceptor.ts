import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { LoggerService } from "../../logger/logger.service";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, headers, body } = req;
    const now = Date.now();

    const maskedHeaders = { ...headers };
    if (maskedHeaders.authorization) {
      maskedHeaders.authorization = "********"; // Mask sensitive token
    }

    this.logger.log(`Request ${method} ${url}`, "Request", {
      headers: maskedHeaders,
      body,
    });

    return next.handle().pipe(
      tap(
        (data) => {
          this.logger.log(
            `Response ${method} ${url} - ${Date.now() - now}ms`,
            "Response",
            { status: context.switchToHttp().getResponse().statusCode, data }
          );
        },
        (error) => {
          this.logger.error(
            `Error ${method} ${url} - ${Date.now() - now}ms`,
            error.stack, // Log stack trace for errors
            "Error",
            {
              status: context.switchToHttp().getResponse().statusCode,
              message: error.message,
            }
          );
        }
      )
    );
  }
}
