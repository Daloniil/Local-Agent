import { Module } from "@nestjs/common";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { FilesModule } from "../files/files.module"; // Import FilesModule
import { LoggerModule } from "../logger/logger.module";

@Module({
  imports: [ConfigModule, HttpModule, FilesModule, LoggerModule],
  controllers: [LlmController],
  providers: [LlmService],
  exports: [LlmService], // Export LlmService if it needs to be used by other modules (e.g., FilesModule for action execution context)
})
export class LlmModule {}
