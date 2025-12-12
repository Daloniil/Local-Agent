import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "../logger/logger.module"; // Import LoggerModule

@Module({
  imports: [ConfigModule, LoggerModule], // Add LoggerModule to imports
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService], // Export FilesService
})
export class FilesModule {}
