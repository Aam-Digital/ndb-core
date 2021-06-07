import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";

@Injectable({
  providedIn: "root",
})
export class ConfigMigrationService {
  constructor(private configService: ConfigService) {}

  migrateConfig() {}
}
