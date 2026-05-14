import {
  Component,
  input,
  effect,
  ChangeDetectionStrategy,
} from "@angular/core";
import { EntityConstructor } from "../../entity/model/entity";
import {
  EntityListConfig,
  GroupConfig,
} from "../../entity-list/EntityListConfig";
import { MatTableModule } from "@angular/material/table";
import { AdminTabsComponent } from "../building-blocks/admin-tabs/admin-tabs.component";
import { AdminTabTemplateDirective } from "../building-blocks/admin-tabs/admin-tab-template.directive";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { Logging } from "../../logging/logging.service";
import { AdminListManagerComponent } from "#src/app/core/admin/admin-list-manager/admin-list-manager.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-entity-list",
  imports: [
    MatTableModule,
    AdminTabsComponent,
    AdminTabTemplateDirective,
    ViewTitleComponent,
    AdminListManagerComponent,
    HintBoxComponent,
  ],
  templateUrl: "./admin-entity-list.component.html",
  styleUrls: ["./admin-entity-list.component.scss"],
})
export class AdminEntityListComponent {
  entityConstructor = input.required<EntityConstructor>();
  config = input.required<EntityListConfig>();

  filters: string[];

  constructor() {
    effect(() => {
      const entityConstructor = this.entityConstructor();
      const config = this.config();

      config.entityType = config.entityType ?? entityConstructor.ENTITY_TYPE;
      config.filters = config.filters ?? [];

      this.initColumnGroupsIfNecessary(config);

      this.filters = config.filters.map((f) => f.id);
    });
  }

  /**
   * Config allows to not have columnGroups and by default then display all `columns`,
   * create an initial columnGroup in this case to allow full editing.
   * @private
   */
  private initColumnGroupsIfNecessary(config: EntityListConfig) {
    if (!config.columnGroups) {
      config.columnGroups = {
        groups: [
          {
            name: "",
            columns: (config.columns ?? []).map((c) =>
              typeof c === "string" ? c : c.id,
            ),
          },
        ],
      };
    }
  }

  updateFilters(filters: string[]) {
    if (!Array.isArray(filters)) {
      Logging.warn(
        "AdminEntityListComponent: updateFilters: filters is not an array",
      );
      filters = [];
    }

    this.filters = [...filters];
    this.config().filters = this.filters.map(
      (f) =>
        this.config().filters.find(
          (existingFilter) => existingFilter.id === f,
        ) ?? { id: f },
    );
  }

  updateColumns(columns: string[], group: GroupConfig) {
    if (!Array.isArray(columns)) {
      Logging.warn(
        "AdminEntityListComponent: updateColumns: columns is not an array",
      );
      return;
    }
    group.columns = columns;
  }

  newColumnGroupFactory(): GroupConfig {
    return { name: "", columns: [] };
  }
}
