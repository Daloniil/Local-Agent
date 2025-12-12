import { BadRequestException, Injectable } from "@nestjs/common";

import { LoggerService } from "../logger/logger.service";
import { ConversationHistoryService } from "./modules/conversation-history.service";
import { FileOperationHandlerService } from "./modules/file-operation-handler.service";
import { GeneralQuestionHandlerService } from "./modules/general-question-handler.service";
import { IntentClassifierService } from "./modules/intent-classifier.service";
import { LlmLogMessages } from "./llm.messages";
import { LlmIntent } from "./llm-intent.enum";

@Injectable()
export class LlmService {
  constructor(
    private loggerService: LoggerService,
    private intentClassifierService: IntentClassifierService,
    private generalQuestionHandlerService: GeneralQuestionHandlerService,
    private fileOperationHandlerService: FileOperationHandlerService,
    private conversationHistoryService: ConversationHistoryService
  ) {}

  private async _classifyIntent(prompt: string): Promise<any> {
    const classificationResult =
      await this.intentClassifierService.classifyUserIntent(prompt);
    this.loggerService.log(
      LlmLogMessages.INTENT_CLASSIFIED(
        classificationResult.classification,
        prompt
      ),
      "LlmService"
    );
    return classificationResult;
  }

  private async _handleFileOperation(prompt: string): Promise<string> {
    this.loggerService.log(
      LlmLogMessages.FILE_OPERATION_CLASSIFIED(prompt),
      "LlmService"
    );
    return await this.fileOperationHandlerService.handleFileOperation(
      prompt,
      this.conversationHistoryService.getHistory()
    );
  }

  private async _handleGeneralQuestion(
    prompt: string,
    generalAnswer: string
  ): Promise<string> {
    this.loggerService.log(
      LlmLogMessages.GENERAL_QUESTION_CLASSIFIED(prompt),
      "LlmService"
    );
    if (generalAnswer) {
      return generalAnswer;
    } else {
      this.loggerService.warn(
        LlmLogMessages.GENERAL_QUESTION_NO_ANSWER,
        "LlmService"
      );
      return await this.generalQuestionHandlerService.handleGeneralQuestion(
        prompt,
        this.conversationHistoryService.getHistory()
      );
    }
  }

  private _logAndStoreConversation(
    prompt: string,
    assistantResponse: string
  ): void {
    this.conversationHistoryService.addMessage({
      role: "user",
      content: prompt,
    });
    this.loggerService.log(
      LlmLogMessages.USER_MESSAGE_ADDED_TO_HISTORY(
        this.conversationHistoryService.getHistory().length
      ),
      "LlmService"
    );
    this.conversationHistoryService.addMessage({
      role: "assistant",
      content: assistantResponse,
    });
    this.loggerService.log(
      LlmLogMessages.ASSISTANT_RESPONSE_ADDED_TO_HISTORY(
        this.conversationHistoryService.getHistory().length
      ),
      "LlmService"
    );
  }

  private _handleLlmError(error: any): never {
    this.loggerService.error(
      LlmLogMessages.ERROR_COMMUNICATING_WITH_LLM(error.message),
      error.message,
      "LlmService"
    );
    throw new BadRequestException(
      LlmLogMessages.FAILED_TO_GET_RESPONSE_FROM_LLM
    );
  }

  async askLlm(prompt: string): Promise<any> {
    try {
      this.loggerService.log(
        LlmLogMessages.RECEIVED_QUERY(prompt),
        "LlmService"
      );

      const classificationResult = await this._classifyIntent(prompt);

      let assistantResponse: string;
      if (classificationResult.classification === LlmIntent.FILE_OPERATION) {
        assistantResponse = await this._handleFileOperation(prompt);
      } else if (
        classificationResult.classification === LlmIntent.GENERAL_QUESTION
      ) {
        assistantResponse = await this._handleGeneralQuestion(
          prompt,
          classificationResult.general_Answer
        );
      }

      this._logAndStoreConversation(prompt, assistantResponse);

      return assistantResponse;
    } catch (error: any) {
      this._handleLlmError(error);
    }
  }
}
