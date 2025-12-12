import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "pino";
import pino from "pino";
import * as PinoRoll from "pino-roll";

@Injectable()
export class LoggerService {
  private readonly logger: Logger;

  constructor(private configService: ConfigService) {
    this.logger = pino({
      level: this.configService.get<string>("LOG_LEVEL", "info"),
      transport: {
        targets: [
          {
            target: "pino-pretty",
            options: {
              colorize: true,
            },
            level: "info",
          },
          {
            target: "pino-roll",
            options: {
              file: this.configService.get<string>(
                "LOG_FILE_PATH",
                "./logs/app.log"
              ),
              frequency: "daily",
              size: "10m",
              mkdir: true,
            },
            level: "info",
          },
        ],
      },
    });
  }

  log(message: string, context?: string, data?: any) {
    this.logger.info({ context, data }, message);
  }

  error(message: string, trace?: string, context?: string, data?: any) {
    this.logger.error({ context, trace, data }, message);
  }

  warn(message: string, context?: string, data?: any) {
    this.logger.warn({ context, data }, message);
  }

  debug(message: string, context?: string, data?: any) {
    this.logger.debug({ context, data }, message);
  }
}
