import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from "@nestjs/common";
import { LlmService } from "./llm.service";
import { LlmActionDto } from "./dto/llm-action.dto";
import { AuthGuard } from "../auth/auth.guard";

@UseGuards(AuthGuard)
@Controller("llm")
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post("ask")
  async askLlm(@Body("prompt") prompt: string) {
    return this.llmService.askLlm(prompt);
  }
}
