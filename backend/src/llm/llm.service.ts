import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { FilesService } from "../files/files.service";
import { LoggerService } from "../logger/logger.service";
import {
  CLASSIFICATION_PROMPT,
  FILE_OPERATION_PROMPT,
  SUMMARY_PROMPT,
} from "./llm.prompts";
import { ollama } from "ollama-ai-provider-v2";
import { generateObject, generateText } from "ai";
import z from "zod";

interface LlmAction {
  action: "read" | "list" | "write" | "delete";
  path: string;
  args?: any;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

@Injectable()
export class LlmService {
  private llmEndpoint: string;
  private conversationHistory: ConversationMessage[] = [];
  private readonly MAX_HISTORY_MESSAGES = 10;

  constructor(
    private configService: ConfigService,
    private filesService: FilesService,
    private loggerService: LoggerService
  ) {
    this.llmEndpoint = this.configService.get<string>("LLM_ENDPOINT");
  }

  private formatConversationHistory(): string {
    return this.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
  }

  private async executeLlmAction(action: LlmAction): Promise<any> {
    this.loggerService.log(
      `Executing LLM action: ${action.action} on path: ${action.path}`,
      "LlmService"
    );
    try {
      switch (action.action) {
        case "list":
          return await this.filesService.listFiles(action.path);
        case "read":
          this.loggerService.log(
            `Reading file: ${action.path} with previewLines: ${action.args?.previewLines}`,
            "LlmService"
          );
          return await this.filesService.readFile(
            action.path,
            action.args?.previewLines
          );
        case "write":
          if (action.args?.instruction) {
            this.loggerService.log(
              `Writing file: ${action.path} with instruction: ${action.args.instruction}`,
              "LlmService"
            );
            const currentContent = await this.filesService.readFile(
              action.path
            );
            const editingPrompt = `Ты — ассистент, который редактирует файлы. Пользователь попросил тебя отредактировать файл. Текущее содержимое файла:\\n\`\`\`\\n${currentContent}\\n\`\`\`\\nИнструкция по редактированию: \"${action.args.instruction}\"\\nВерни ТОЛЬКО НОВОЕ СОДЕРЖИМОЕ ФАЙЛА, без каких-либо объяснений, комментариев или форматирования.`;
            this.loggerService.log(
              `LLM editing prompt: ${editingPrompt}`,
              "LlmService"
            );

            const { text: newContent } = await generateText({
              model: ollama("deepseek-r1:8b"),
              providerOptions: { ollama: { think: true } },
              prompt: editingPrompt,
            });

            this.loggerService.log(
              `File ${action.path} edited. New content length: ${newContent.length}`,
              "LlmService"
            );
            try {
              await this.filesService.writeFile(action.path, newContent);
              this.loggerService.log(
                `File ${action.path} written successfully.`,
                "LlmService"
              );
              return "SUCCESS: File written successfully.";
            } catch (error: any) {
              this.loggerService.error(
                `Error writing file: ${error.message}`,
                error.stack,
                "LlmService"
              );
              return "ERROR: Failed to write file. Please try again.";
            }
          } else if (action.args?.content) {
            this.loggerService.log(
              `Writing file: ${action.path} with content length: ${action.args.content.length}`,
              "LlmService"
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
          this.loggerService.log(`Deleting file: ${action.path}`, "LlmService");
          return await this.filesService.deleteFile(action.path);
        default:
          this.loggerService.error(
            `Unknown LLM action: ${action.action}`,
            null,
            "LlmService"
          );
          throw new BadRequestException(`Unknown action: ${action.action}`);
      }
    } catch (error: any) {
      this.loggerService.error(
        `Error executing LLM action ${action.action}: ${error.message}`,
        error.stack,
        "LlmService"
      );
      throw new BadRequestException(
        `Failed to execute LLM action: ${error.message}`
      );
    }
  }

  private async classifyUserIntent(
    prompt: string
  ): Promise<"FILE_OPERATION" | "GENERAL_QUESTION" | "UNKNOWN"> {
    this.loggerService.log(
      `Classifying user intent for prompt: ${prompt}`,
      "LlmService"
    );

    this.loggerService.log(
      `System Prompt: ${CLASSIFICATION_PROMPT}\n\n User Promt: ${prompt}`,
      "LlmService"
    );

    const { object } = await generateObject({
      model: ollama("deepseek-r1:8b"),
      providerOptions: { ollama: { think: true } },
      prompt,
      system: CLASSIFICATION_PROMPT,
      schema: z.object({
        classification: z.enum(["FILE_OPERATION", "GENERAL_QUESTION"]),
      }),
    });

    this.loggerService.log(
      `LLM classification raw response: ${object.classification}`,
      "LlmService"
    );

    return object.classification;
  }

  private async handleFileOperation(prompt: string): Promise<string> {
    this.loggerService.log(
      `Handling file operation for prompt: ${prompt}`,
      "LlmService"
    );

    const { object: toolCallResponse }: { object: { action: LlmAction } } =
      await generateObject({
        model: ollama("deepseek-r1:8b"),
        providerOptions: { ollama: { think: true } },
        prompt: `Narative Context: ${this.formatConversationHistory()}\n\nUser Promt: ${prompt}`,
        system: FILE_OPERATION_PROMPT,
        schema: z.object({
          action: z.enum(["list", "read", "write", "delete"]),
        }),
      });

    this.loggerService.log(
      `LLM file operation raw response: ${toolCallResponse.action}`,
      "LlmService"
    );

    if (toolCallResponse.action) {
      try {
        const actionResult = await this.executeLlmAction(
          toolCallResponse.action
        );
        return await this.summarizeFileOperation(
          prompt,
          toolCallResponse.action,
          actionResult
        );
      } catch (error: any) {
        this.loggerService.error(
          `Error executing LLM action or summarizing: ${error.message}`,
          error.stack,
          "LlmService"
        );
        throw new BadRequestException(
          `Failed to execute LLM action or summarize: ${error.message}`
        );
      }
    } else {
      this.loggerService.warn(
        `LLM classified as FILE_OPERATION but did not return a valid LlmAction. Falling back to general question. Raw LLM response: ${toolCallResponse.action}`,
        "LlmService"
      );
      return await this.handleGeneralQuestion(prompt);
    }
  }

  private async handleGeneralQuestion(prompt: string): Promise<string> {
    this.loggerService.log(
      `Handling general question for prompt: ${prompt}`,
      "LlmService"
    );

    const generalQuestionPrompt = `Narative Context: ${this.formatConversationHistory()}\n\nUser Promt: ${prompt}`;

    this.loggerService.log(
      `General question request: ${JSON.stringify(generalQuestionPrompt)}`,
      "LlmService"
    );

    const { text: generalResponse } = await generateText({
      model: ollama("deepseek-r1:8b"),
      providerOptions: { ollama: { think: true } },
      prompt: generalQuestionPrompt,
    });

    this.loggerService.log(
      `LLM general question raw response: ${generalResponse}`,
      "LlmService"
    );
    return generalResponse;
  }

  private async summarizeFileOperation(
    userPrompt: string,
    llmAction: LlmAction,
    actionResult: any
  ): Promise<string> {
    this.loggerService.log(
      `Summarizing file operation for user prompt: ${userPrompt}`,
      "LlmService"
    );
    const summaryPrompt = SUMMARY_PROMPT(
      userPrompt,
      JSON.stringify(llmAction),
      JSON.stringify(actionResult)
    );

    this.loggerService.log(`Summary Prompt: ${summaryPrompt}`, "LlmService");

    const { text: summaryResponse } = await generateText({
      model: ollama("deepseek-r1:8b"),
      providerOptions: { ollama: { think: true } },
      prompt: `Narative Context: ${this.formatConversationHistory()}`,
      system: summaryPrompt,
    });

    this.loggerService.log(
      `LLM summary raw response: ${summaryResponse}`,
      "LlmService"
    );
    return summaryResponse;
  }

  async askLlm(prompt: string): Promise<any> {
    this.loggerService.log(`Received LLM query: ${prompt}`, "LlmService");
    if (this.conversationHistory.length >= this.MAX_HISTORY_MESSAGES) {
      this.conversationHistory = this.conversationHistory.slice(
        this.conversationHistory.length - this.MAX_HISTORY_MESSAGES + 1
      );
    }
    const classification = await this.classifyUserIntent(prompt);

    this.loggerService.log(
      `User intent classified as ${classification} for prompt: ${prompt}`,
      "LlmService"
    );
    let assistantResponse: string;
    if (classification === "FILE_OPERATION") {
      this.loggerService.log(
        `User intent classified as FILE_OPERATION for prompt: ${prompt}`,
        "LlmService"
      );
      assistantResponse = await this.handleFileOperation(prompt);
    } else if (classification === "GENERAL_QUESTION") {
      this.loggerService.log(
        `User intent classified as GENERAL_QUESTION for prompt: ${prompt}`,
        "LlmService"
      );
      assistantResponse = await this.handleGeneralQuestion(prompt);
    } else {
      this.loggerService.error(
        `Unexpected classification from LLM: ${classification}`,
        null,
        "LlmService"
      );
      throw new BadRequestException(
        "Failed to classify user intent. Please rephrase your request."
      );
    }

    this.conversationHistory.push({ role: "user", content: prompt });
    this.loggerService.log(
      `User message added to history. History length: ${this.conversationHistory.length}`,
      "LlmService"
    );
    this.conversationHistory.push({
      role: "assistant",
      content: assistantResponse,
    });
    this.loggerService.log(
      `Assistant response added to history. History length: ${this.conversationHistory.length}`,
      "LlmService"
    );
    return assistantResponse;
  }
  catch(error: any) {
    this.loggerService.error(
      "Error communicating with LLM:",
      error.message,
      "LlmService"
    );
    throw new BadRequestException("Failed to get response from LLM.");
  }
}
