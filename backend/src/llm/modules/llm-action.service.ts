import { BadRequestException, Injectable } from "@nestjs/common";
import { FilesService } from "../../files/files.service";
import { LoggerService } from "../../logger/logger.service";
import { generateText } from "ai";
import { ollama } from "ollama-ai-provider-v2";

export interface LlmAction {
  action: "read" | "list" | "write" | "delete";
  path: string;
  args?: any;
}

@Injectable()
export class LlmActionService {
  constructor(
    private filesService: FilesService,
    private loggerService: LoggerService
  ) {}

  async executeLlmAction(action: LlmAction): Promise<any> {
    this.loggerService.log(
      `Executing LLM action: ${action.action} on path: ${action.path}`,
      "LlmActionService"
    );
    try {
      switch (action.action) {
        case "list":
          return await this.filesService.listFiles(action.path);
        case "read":
          this.loggerService.log(
            `Reading file: ${action.path} with previewLines: ${action.args?.previewLines}`,
            "LlmActionService"
          );
          return await this.filesService.readFile(
            action.path,
            action.args?.previewLines
          );
        case "write":
          if (action.args?.instruction) {
            this.loggerService.log(
              `Writing file: ${action.path} with instruction: ${action.args.instruction}`,
              "LlmActionService"
            );
            const currentContent = await this.filesService.readFile(
              action.path
            );
            const editingPrompt = `Ты — ассистент, который редактирует файлы. Пользователь попросил тебя отредактировать файл. Текущее содержимое файла:\\n\`\`\`\\n${currentContent}\\n\`\`\`\\nИнструкция по редактированию: \"${action.args.instruction}\"\\nВерни ТОЛЬКО НОВОЕ СОДЕРЖИМОЕ ФАЙЛА, без каких-либо объяснений, комментариев или форматирования.`;
            this.loggerService.log(
              `LLM editing prompt: ${editingPrompt}`,
              "LlmActionService"
            );

            const { text: newContent } = await generateText({
              model: ollama("deepseek-r1:8b"),
              providerOptions: { ollama: { think: true } },
              prompt: editingPrompt,
            });

            this.loggerService.log(
              `File ${action.path} edited. New content length: ${newContent.length}`,
              "LlmActionService"
            );
            try {
              await this.filesService.writeFile(action.path, newContent);
              this.loggerService.log(
                `File ${action.path} written successfully.`,
                "LlmActionService"
              );
              return "SUCCESS: File written successfully.";
            } catch (error: any) {
              this.loggerService.error(
                `Error writing file: ${error.message}`,
                error.stack,
                "LlmActionService"
              );
              return "ERROR: Failed to write file. Please try again.";
            }
          } else if (action.args?.content) {
            this.loggerService.log(
              `Writing file: ${action.path} with content length: ${action.args.content.length}`,
              "LlmActionService"
            );
            return await this.filesService.writeFile(
              action.path,
              action.args?.content
            );
          } else {
            throw new BadRequestException(
              "Для действия 'write' требуется либо 'content', либо 'instruction'."
            );
          }
        case "delete":
          this.loggerService.log(
            `Deleting file: ${action.path}`,
            "LlmActionService"
          );
          return await this.filesService.deleteFile(action.path);
        default:
          this.loggerService.error(
            `Unknown LLM action: ${action.action}`,
            null,
            "LlmActionService"
          );
          throw new BadRequestException(`Unknown action: ${action.action}`);
      }
    } catch (error: any) {
      this.loggerService.error(
        `Error executing LLM action ${action.action}: ${error.message}`,
        error.stack,
        "LlmActionService"
      );
      throw new BadRequestException(
        `Failed to execute LLM action: ${error.message}`
      );
    }
  }
}
