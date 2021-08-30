import { Injectable } from "@angular/core";
import { ConfigService } from "../config/config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "../view/dynamic-routing/view-config.interface";

@Injectable({
  providedIn: "root",
})
export class PermissionsMigrationService {
  private readonly ADMIN_ROLE = "admin_app";

  constructor(
    private configService: ConfigService,
    private entityMapper: EntityMapperService
  ) {}

  public async migrateRoutePermissions() {
    const currentConfig = await this.configService.loadConfig(
      this.entityMapper
    );
    Object.keys(currentConfig.data)
      .filter((key) => key.startsWith(PREFIX_VIEW_CONFIG))
      .forEach((key) => this.migrateViewConfig(currentConfig.data[key]));
    await this.configService.saveConfig(this.entityMapper, currentConfig.data);
  }

  private migrateViewConfig(viewConfig: ViewConfig) {
    if (
      viewConfig.hasOwnProperty("requiresAdmin") &&
      viewConfig["requiresAdmin"] === true
    ) {
      viewConfig.permittedUserRoles = [this.ADMIN_ROLE];
      delete viewConfig["requiresAdmin"];
    }
  }
}
