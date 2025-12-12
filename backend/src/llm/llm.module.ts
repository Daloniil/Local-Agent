import { Module } from "@nestjs/common";
import { LlmController } from "./llm.controller";
import { LlmService } from "./llm.service";
import { FilesModule } from "../files/files.module";
import { LoggerModule } from "../logger/logger.module";
import { LlmActionService } from "./modules/llm-action.service";
import { IntentClassifierService } from "./modules/intent-classifier.service";
import { GeneralQuestionHandlerService } from "./modules/general-question-handler.service";
import { FileOperationSummarizerService } from "./modules/file-operation-summarizer.service";
import { FileOperationHandlerService } from "./modules/file-operation-handler.service";
import { ConversationHistoryService } from "./modules/conversation-history.service";

@Module({
  imports: [FilesModule, LoggerModule],
  controllers: [LlmController],
  providers: [
    LlmService,
    LlmActionService,
    IntentClassifierService,
    GeneralQuestionHandlerService,
    FileOperationSummarizerService,
    FileOperationHandlerService,
    ConversationHistoryService,
  ],
  exports: [LlmService],
})
export class LlmModule {}
