import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigService {
  constructor(private nestConfigService: ConfigService) {}

  getAppConfig() {
    return {
      allowWrite: this.nestConfigService.get<boolean>("ALLOW_WRITE", false),
      allowDelete: this.nestConfigService.get<boolean>("ALLOW_DELETE", false),
    };
  }
}
