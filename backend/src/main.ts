import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { AuthGuard } from "./auth/auth.guard"; // Import AuthGuard
import { ConfigService } from "@nestjs/config"; // Import ConfigService
import { LoggerService } from "./logger/logger.service"; // Import LoggerService
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor"; // Import LoggingInterceptor

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true }); // Enable bufferLogs

  const loggerService = app.get(LoggerService);
  app.useLogger(loggerService); // Use custom logger

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  );

  // Get ConfigService instance to access environment variables
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);

  // Temporarily remove global AuthGuard application
  // app.useGlobalGuards(new AuthGuard(configService)); // REMOVE OR COMMENT OUT THIS LINE

  app.useGlobalInterceptors(new LoggingInterceptor(loggerService));

  await app.listen(port);
}
bootstrap();
