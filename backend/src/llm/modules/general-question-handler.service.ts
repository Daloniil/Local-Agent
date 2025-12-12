import { Injectable } from "@nestjs/common";
import { LoggerService } from "../../logger/logger.service";
import { ollama } from "ollama-ai-provider-v2";
import { generateText } from "ai";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

@Injectable()
export class GeneralQuestionHandlerService {
  constructor(private loggerService: LoggerService) {}

  private formatConversationHistory(history: ConversationMessage[]): string {
    return history.map((msg) => `${msg.role}: ${msg.content}`).join("\n");
  }

  async handleGeneralQuestion(
    prompt: string,
    conversationHistory: ConversationMessage[]
  ): Promise<string> {
    this.loggerService.log(
      `Handling general question for prompt: ${prompt}`,
      "GeneralQuestionHandlerService"
    );

    const generalQuestionPrompt = `Narative Context: ${this.formatConversationHistory(
      conversationHistory
    )}\n\nUser Promt: ${prompt}`;

    this.loggerService.log(
      `General question request: ${JSON.stringify(generalQuestionPrompt)}`,
      "GeneralQuestionHandlerService"
    );

    const { text: generalResponse } = await generateText({
      model: ollama("deepseek-r1:8b"),
      providerOptions: { ollama: { think: true } },
      prompt: generalQuestionPrompt,
    });

    this.loggerService.log(
      `LLM general question raw response: ${generalResponse}`,
      "GeneralQuestionHandlerService"
    );
    return generalResponse;
  }
}
