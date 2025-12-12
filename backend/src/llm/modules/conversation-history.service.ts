import { Injectable } from "@nestjs/common";
import { ConversationMessage } from "./conversation-message.interface";

@Injectable()
export class ConversationHistoryService {
  private conversationHistory: ConversationMessage[] = [];
  private readonly MAX_HISTORY_MESSAGES = 10;

  getHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  addMessage(message: ConversationMessage): void {
    this._manageConversationHistory();
    this.conversationHistory.push(message);
  }

  private _manageConversationHistory(): void {
    if (this.conversationHistory.length >= this.MAX_HISTORY_MESSAGES) {
      this.conversationHistory = this.conversationHistory.slice(
        this.conversationHistory.length - this.MAX_HISTORY_MESSAGES + 1
      );
    }
  }
}
