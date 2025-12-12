import { Module } from "@nestjs/common";
import { ConfigController } from "./config.controller";
import { ConfigService } from "@nestjs/config"; // Import NestJS ConfigService
import { AppConfigService } from "./config.service"; // Our custom config service

@Module({
  imports: [], // ConfigModule is global, so no need to import here
  controllers: [ConfigController],
  providers: [AppConfigService], // Provide our custom config service
  exports: [AppConfigService], // Export if other modules need it
})
export class ConfigModule {}
