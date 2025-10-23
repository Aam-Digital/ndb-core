import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
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
export class AdminEntityListComponent implements OnChanges {
  @Input() entityConstructor: EntityConstructor;
  @Input() config: EntityListConfig;

  filters: string[];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      this.config = this.config ?? {
        entityType: this.entityConstructor.ENTITY_TYPE,
      };
      this.config.filters = this.config.filters ?? [];

      this.initColumnGroupsIfNecessary();

      this.filters = (this.config.filters ?? []).map((f) => f.id);
    }
  }

  /**
   * Config allows to not have columnGroups and by default then display all `columns`,
   * create an initial columnGroup in this case to allow full editing.
   * @private
   */
  private initColumnGroupsIfNecessary() {
    if (!this.config.columnGroups) {
      this.config.columnGroups = {
        groups: [
          {
            name: "",
            columns: (this.config.columns ?? []).map((c) =>
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
    this.config.filters = this.filters.map(
      (f) =>
        this.config.filters.find(
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
