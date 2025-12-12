import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FilesModule } from "./files/files.module";
import { LlmModule } from "./llm/llm.module";
import { LoggerModule } from "./logger/logger.module";
import { ConfigModule as AppConfigModule } from "./config/config.module"; // Import our custom ConfigModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    FilesModule,
    LlmModule,
    LoggerModule,
    AppConfigModule, // Add our custom ConfigModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
