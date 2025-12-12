import { BadRequestException, Injectable } from "@nestjs/common";
import { LoggerService } from "../../logger/logger.service";
import { CLASSIFICATION_PROMPT } from "../llm.prompts";
import { ollama } from "ollama-ai-provider-v2";
import { generateObject } from "ai";
import z from "zod";
import { LlmIntent } from "../llm-intent.enum";

interface ClassificationResult {
  classification: LlmIntent;
  general_Answer?: string;
}

@Injectable()
export class IntentClassifierService {
  constructor(private loggerService: LoggerService) {}

  async classifyUserIntent(prompt: string): Promise<ClassificationResult> {
    this.loggerService.log(
      `Classifying user intent for prompt: ${prompt}`,
      "IntentClassifierService"
    );

    this.loggerService.log(
      `System Prompt: ${CLASSIFICATION_PROMPT}\n\n User Promt: ${prompt}`,
      "IntentClassifierService"
    );

    const { object } = await generateObject({
      model: ollama("llama3:8b"),
      prompt,
      system: CLASSIFICATION_PROMPT,
      schema: z.object({
        classification: z.enum(Object.values(LlmIntent)),
        general_Answer: z.string().optional(),
      }),
    });

    this.loggerService.log(
      `LLM classification raw response: ${JSON.stringify(object)}`,
      "IntentClassifierService"
    );

    return object;
  }
}
