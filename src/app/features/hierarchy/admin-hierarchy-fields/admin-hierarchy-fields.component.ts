import { Component, computed, input, linkedSignal } from "@angular/core";
import { MatOption } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityListConfig } from "#src/app/core/entity-list/EntityListConfig";
import { resolveLocaleText } from "#src/app/core/language/active-locale";
import { getHierarchyFieldCandidates } from "../hierarchy-fields";
import {
  HierarchyDataSource,
  HierarchyDataSourceConfig,
} from "../hierarchy-data-source";

/**
 * Admin setting of a list: the fields by which users can display the list as a hierarchy
 * (shown in the admin editor of list views through `ADMIN_ENTITY_LIST_SETTINGS`).
 * Updates the list config in place, as the other parts of the admin list editor do.
 * Not shown for a record type without any link field to its own type.
 */
@Component({
  selector: "app-admin-hierarchy-fields",
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    FaDynamicIconComponent,
  ],
  templateUrl: "./admin-hierarchy-fields.component.html",
  styleUrl: "./admin-hierarchy-fields.component.scss",
})
export class AdminHierarchyFieldsComponent {
  entityConstructor = input.required<EntityConstructor>();
  /** the list config, updated in place */
  config = input.required<EntityListConfig>();

  /** link fields to one record of the same type, in the order of the schema */
  protected readonly candidates = computed(() =>
    getHierarchyFieldCandidates(this.entityConstructor()).map((id) => ({
      id,
      label:
        resolveLocaleText(this.entityConstructor().schema.get(id)?.label) ?? id,
    })),
  );

  /** the selected fields, in the order of selection */
  protected readonly selected = linkedSignal<string[]>(() => {
    const dataSource = this.config().dataSource;
    const isHierarchy =
      typeof dataSource === "object" &&
      dataSource?.name === HierarchyDataSource.DATA_SOURCE_NAME;
    return isHierarchy
      ? ((dataSource.config as HierarchyDataSourceConfig)?.hierarchyFields ??
          [])
      : [];
  });

  /**
   * Keeps the selected fields in the order they were selected, newly selected ones last
   * (the select would sort them in the order of the options otherwise).
   */
  protected readonly bySelectionOrder = (a: MatOption, b: MatOption) => {
    const selected = this.selected();
    const rank = (option: MatOption) => {
      const index = selected.indexOf(option.value);
      return index === -1 ? selected.length : index;
    };
    return rank(a) - rank(b);
  };

  protected select(fields: string[]) {
    this.selected.set(fields);
    const config = this.config();
    if (fields.length > 0) {
      const hierarchyConfig: HierarchyDataSourceConfig = {
        hierarchyFields: fields,
      };
      config.dataSource = {
        name: HierarchyDataSource.DATA_SOURCE_NAME,
        config: hierarchyConfig,
      };
    } else if (typeof config.dataSource === "object") {
      delete config.dataSource;
    }
  }
}
