import { Controller, Get, UseGuards } from "@nestjs/common"; // Add UseGuards
import { AppConfigService } from "./config.service";
// import { Public } from "../common/decorators/public.decorator"; // Remove Public decorator import
import { AuthGuard } from "../auth/auth.guard"; // Import AuthGuard

@Controller("config")
export class ConfigController {
  constructor(private readonly configService: AppConfigService) {}

  // @Public() // Remove Public decorator
  @Get()
  getAppConfig() {
    return this.configService.getAppConfig();
  }
}
