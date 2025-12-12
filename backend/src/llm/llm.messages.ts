export const LlmLogMessages = {
  RECEIVED_QUERY: (prompt: string) => `Received LLM query: ${prompt}`,
  INTENT_CLASSIFIED: (classification: string, prompt: string) =>
    `User intent classified as ${classification} for prompt: ${prompt}`,
  FILE_OPERATION_CLASSIFIED: (prompt: string) =>
    `User intent classified as FILE_OPERATION for prompt: ${prompt}`,
  GENERAL_QUESTION_CLASSIFIED: (prompt: string) =>
    `User intent classified as GENERAL_QUESTION for prompt: ${prompt}`,
  GENERAL_QUESTION_NO_ANSWER: `LLM classified as GENERAL_QUESTION but did not provide a general_Answer. Falling back to GeneralQuestionHandlerService.`,
  UNEXPECTED_CLASSIFICATION: (classification: string) =>
    `Unexpected classification from LLM: ${classification}`,
  FAILED_TO_CLASSIFY_INTENT: `Failed to classify user intent. Please rephrase your request.`,
  USER_MESSAGE_ADDED_TO_HISTORY: (length: number) =>
    `User message added to history. History length: ${length}`,
  ASSISTANT_RESPONSE_ADDED_TO_HISTORY: (length: number) =>
    `Assistant response added to history. History length: ${length}`,
  ERROR_COMMUNICATING_WITH_LLM: (message: string) =>
    `Error communicating with LLM: ${message}`,
  FAILED_TO_GET_RESPONSE_FROM_LLM: `Failed to get response from LLM.`,
};
