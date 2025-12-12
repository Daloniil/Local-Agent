import { Injectable } from "@nestjs/common";
import { LoggerService } from "../../logger/logger.service";
import { ollama } from "ollama-ai-provider-v2";
import { generateText } from "ai";
import { SUMMARY_PROMPT } from "../llm.prompts";
import { LlmAction } from "./llm-action.service";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

@Injectable()
export class FileOperationSummarizerService {
  constructor(private loggerService: LoggerService) {}

  private formatConversationHistory(history: ConversationMessage[]): string {
    return history.map((msg) => `${msg.role}: ${msg.content}`).join("\n");
  }

  async summarizeFileOperation(
    userPrompt: string,
    llmAction: LlmAction,
    actionResult: any,
    conversationHistory: ConversationMessage[]
  ): Promise<string> {
    this.loggerService.log(
      `Summarizing file operation for user prompt: ${userPrompt}`,
      "FileOperationSummarizerService"
    );
    const summaryPrompt = SUMMARY_PROMPT(
      userPrompt,
      JSON.stringify(llmAction),
      JSON.stringify(actionResult)
    );

    this.loggerService.log(
      `Summary Prompt: ${summaryPrompt}`,
      "FileOperationSummarizerService"
    );

    const { text: summaryResponse } = await generateText({
      model: ollama("deepseek-r1:8b"),
      providerOptions: { ollama: { think: true } },
      prompt: `Narative Context: ${this.formatConversationHistory(
        conversationHistory
      )}`,
      system: summaryPrompt,
    });

    this.loggerService.log(
      `LLM summary raw response: ${summaryResponse}`,
      "FileOperationSummarizerService"
    );
    return summaryResponse;
  }
}
