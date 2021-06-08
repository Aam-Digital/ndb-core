import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { ViewConfig } from "../view/dynamic-routing/view-config.interface";
import { RouterService } from "../view/dynamic-routing/router.service";
import { EntityListConfig } from "../entity-components/entity-list/EntityListConfig";
import { FormFieldConfig } from "../entity-components/entity-form/entity-form/FormConfig";

@Injectable({
  providedIn: "root",
})
export class ConfigMigrationService {
  readonly entityListComponents = [
    "ChildrenList",
    "SchoolsList",
    "ActivityList",
    "NotesManager",
  ];

  private config: Config;
  constructor(
    private configService: ConfigService,
    private entityMapper: EntityMapperService
  ) {}

  async migrateConfig(): Promise<void> {
    this.config = await this.configService.loadConfig(this.entityMapper);
    const viewConfigs = this.configService.getAllConfigs<ViewConfig>(
      RouterService.PREFIX_VIEW_CONFIG
    );
    viewConfigs.forEach((viewConfig) => {
      if (this.entityListComponents.includes(viewConfig.component)) {
        this.migrateEntityListConfig(viewConfig.config);
      }
    });
    console.log("config", this.config);
  }

  private migrateEntityListConfig(config: EntityListConfig) {
    config.columnGroups = config["columnGroup"];
    delete config["columnGroup"];
    this.migrateColumnConfigs(config.columns as FormFieldConfig[]);
  }

  private migrateColumnConfigs(columns: FormFieldConfig[]) {
    columns.forEach((column: FormFieldConfig) => {
      column.view = column["component"];
      delete column["component"];
      column.label = column["title"];
      delete column["title"];
      if (column.hasOwnProperty("config")) {
        column.additional = column["config"];
        delete column["config"];
      }
      if (column.view === "SchoolBlockWrapper") {
        column.view = "DisplayEntity";
        column.additional = "School";
        column.noSorting = true;
      }
      if (column.view === "DisplayUsers") {
        column.view = "DisplayEntityArray";
        column.additional = "User";
        column.noSorting = true;
      }
    });
  }
}
