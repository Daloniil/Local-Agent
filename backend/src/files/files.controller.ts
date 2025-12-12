import { Controller, Get, Query, Post, Body, UseGuards } from "@nestjs/common";
import { FilesService } from "./files.service";
import { LoggerService } from "../logger/logger.service";
import { AuthGuard } from "../auth/auth.guard"; // Import AuthGuard
import { WriteFileDto } from "./dto/write-file.dto";

@UseGuards(AuthGuard) // Apply AuthGuard to the entire controller
@Controller("files")
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly loggerService: LoggerService
  ) {}

  @Get("list")
  async listFiles(@Query("path") path: string) {
    try {
      return await this.filesService.listFiles(path);
    } catch (error: any) {
      this.loggerService.error(
        `Error in listFiles: ${error.message}`,
        error.stack,
        "FilesController"
      );
      throw new Error(error.message);
    }
  }

  @Get("read")
  async readFile(
    @Query("path") path: string,
    @Query("previewLines") previewLines?: string
  ) {
    try {
      const lines = previewLines ? parseInt(previewLines, 10) : undefined;
      return await this.filesService.readFile(path, lines);
    } catch (error: any) {
      this.loggerService.error(
        `Error in readFile: ${error.message}`,
        error.stack,
        "FilesController"
      );
      throw new Error(error.message);
    }
  }

  @Post("write")
  async writeFile(@Body() writeFileDto: WriteFileDto) {
    try {
      await this.filesService.writeFile(
        writeFileDto.path,
        writeFileDto.content
      );
      return { message: "File written successfully." };
    } catch (error: any) {
      this.loggerService.error(
        `Error in writeFile: ${error.message}`,
        error.stack,
        "FilesController"
      );
      throw new Error(error.message);
    }
  }

  @Post("delete")
  async deleteFile(@Body("path") path: string) {
    try {
      await this.filesService.deleteFile(path);
      return { message: "File deleted successfully." };
    } catch (error: any) {
      this.loggerService.error(
        `Error in deleteFile: ${error.message}`,
        error.stack,
        "FilesController"
      );
      throw new Error(error.message);
    }
  }
}
