import { BadRequestException, Injectable } from "@nestjs/common";
import { LoggerService } from "../../logger/logger.service";
import { generateText } from "ai";
import { FileOperationSummarizerService } from "./file-operation-summarizer.service";
import { ConversationMessage } from "./conversation-message.interface";
import { filesystemLLMTools } from "./filesystem-llm-tools";
import { FilesystemService } from "src/filesystem/filesystem.service";
import { model } from "../lmStudioConnection";

@Injectable()
export class FileOperationHandlerService {
  private llmTools: ReturnType<typeof filesystemLLMTools>;
  private filesystemService: FilesystemService;

  constructor(
    private loggerService: LoggerService,
    private fileOperationSummarizerService: FileOperationSummarizerService
  ) {
    this.filesystemService = new FilesystemService();
    this.llmTools = filesystemLLMTools(this.filesystemService);
  }

  private formatConversationHistory(history: ConversationMessage[]): string {
    return history.map((msg) => `${msg.role}: ${msg.content}`).join("\n");
  }

  async handleFileOperation(
    prompt: string,
    conversationHistory: ConversationMessage[]
  ): Promise<string> {
    this.loggerService.log(
      `Handling file operation for prompt: ${prompt}`,
      "FileOperationHandlerService"
    );

    try {
      const { text, toolCalls } = await generateText({
        model: model,
        prompt: `Narative Context: ${this.formatConversationHistory(
          conversationHistory
        )}\n\nUser Promt: ${prompt}`,
        system: "Always return me output also not only input",
        tools: this.llmTools,
      });

      this.loggerService.log(`Tool Calls: ${JSON.stringify(toolCalls)}`);

      this.loggerService.log(
        `${this.formatConversationHistory(
          conversationHistory
        )}\n\nUser Promt: ${prompt}`
      );

      let fileResult = await this.filesystemService.getFileResult();
      // @ts-ignore
      let toolName = toolCalls.map((toolCall) => toolCall.toolName).join(", ");

      return await this.fileOperationSummarizerService.summarizeFileOperation(
        prompt,
        toolName,
        fileResult,
        conversationHistory
      );
    } catch (error: any) {
      this.loggerService.error(
        `Error during file operation with LLM tools: ${error.message}`,
        error.stack,
        "FileOperationHandlerService"
      );
      throw new BadRequestException(
        `Failed to execute file operation with LLM tools: ${error.message}`
      );
    }
  }
}
