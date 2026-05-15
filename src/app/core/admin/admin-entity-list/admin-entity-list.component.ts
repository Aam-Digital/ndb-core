import {
  Component,
  input,
  effect,
  linkedSignal,
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

  filters = linkedSignal(() => (this.config().filters ?? []).map((f) => f.id));

  columnGroups = linkedSignal(
    () =>
      this.config().columnGroups ?? {
        groups: [
          {
            name: "",
            columns: (this.config().columns ?? []).map((c) =>
              typeof c === "string" ? c : c.id,
            ),
          },
        ],
      },
  );

  constructor() {
    // keep the config object updated in-place while using signals for the component
    effect(() => {
      const config = this.config();
      config.entityType ??= this.entityConstructor().ENTITY_TYPE;
      config.filters = this.filters().map(
        (f) => config.filters?.find((ef) => ef.id === f) ?? { id: f },
      );
      config.columnGroups = this.columnGroups();
    });
  }

  updateFilters(filters: string[]) {
    if (!Array.isArray(filters)) {
      Logging.warn(
        "AdminEntityListComponent: updateFilters: filters is not an array",
      );
      filters = [];
    }
    this.filters.set([...filters]);
  }

  updateColumns(columns: string[], group: GroupConfig) {
    if (!Array.isArray(columns)) {
      Logging.warn(
        "AdminEntityListComponent: updateColumns: columns is not an array",
      );
      return;
    }
    this.columnGroups.update((cg) => ({
      ...cg,
      groups: cg.groups.map((g) => (g === group ? { ...g, columns } : g)),
    }));
  }

  newColumnGroupFactory(): GroupConfig {
    return { name: "", columns: [] };
  }
}
