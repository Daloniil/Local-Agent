import { BadRequestException, Injectable } from "@nestjs/common";
import { LoggerService } from "../../logger/logger.service";
import { ollama } from "ollama-ai-provider-v2";
import { generateObject } from "ai";
import z from "zod";
import { LlmAction, LlmActionService } from "./llm-action.service";
import { FileOperationSummarizerService } from "./file-operation-summarizer.service";
import { GeneralQuestionHandlerService } from "./general-question-handler.service";
import { ConversationMessage } from "./conversation-message.interface";
import { FILE_OPERATION_PROMPT } from "../llm.prompts";

@Injectable()
export class FileOperationHandlerService {
  constructor(
    private loggerService: LoggerService,
    private llmActionService: LlmActionService,
    private fileOperationSummarizerService: FileOperationSummarizerService,
    private generalQuestionHandlerService: GeneralQuestionHandlerService
  ) {}

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

    const { object: toolCallResponse }: { object: { action: LlmAction } } =
      await generateObject({
        model: ollama("deepseek-r1:8b"),
        providerOptions: { ollama: { think: true } },
        prompt: `Narative Context: ${this.formatConversationHistory(
          conversationHistory
        )}\n\nUser Promt: ${prompt}`,
        system: FILE_OPERATION_PROMPT,
        schema: z.object({
          action: z.enum(["list", "read", "write", "delete"]),
        }),
      });

    this.loggerService.log(
      `LLM file operation raw response: ${toolCallResponse.action}`,
      "FileOperationHandlerService"
    );

    if (toolCallResponse.action) {
      try {
        const actionResult = await this.llmActionService.executeLlmAction(
          toolCallResponse.action
        );
        return await this.fileOperationSummarizerService.summarizeFileOperation(
          prompt,
          toolCallResponse.action,
          actionResult,
          conversationHistory
        );
      } catch (error: any) {
        this.loggerService.error(
          `Error executing LLM action or summarizing: ${error.message}`,
          error.stack,
          "FileOperationHandlerService"
        );
        throw new BadRequestException(
          `Failed to execute LLM action or summarize: ${error.message}`
        );
      }
    } else {
      this.loggerService.warn(
        `LLM classified as FILE_OPERATION but did not return a valid LlmAction. Falling back to general question. Raw LLM response: ${toolCallResponse.action}`,
        "FileOperationHandlerService"
      );
      return await this.generalQuestionHandlerService.handleGeneralQuestion(
        prompt,
        conversationHistory
      );
    }
  }
}
