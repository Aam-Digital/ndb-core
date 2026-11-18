import { Component, computed, input, linkedSignal } from "@angular/core";
import { MatOption } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
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
  imports: [MatFormFieldModule, MatSelectModule, HelpButtonComponent],
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

  /**
   * The setting as in the config before the admin changed it
   * (read before the first change, as the config is updated in place).
   */
  private readonly initial = computed(() => {
    const dataSource = this.config().dataSource;
    const isHierarchy =
      typeof dataSource === "object" &&
      dataSource?.name === HierarchyDataSource.DATA_SOURCE_NAME;
    const fields = isHierarchy
      ? (dataSource.config as HierarchyDataSourceConfig)?.hierarchyFields
      : undefined;
    return {
      // a config with an invalid value is shown without fields, so that the admin can fix it
      fields: Array.isArray(fields) ? fields : [],
      // restored when the admin removes all fields again
      otherDataSource: isHierarchy ? undefined : dataSource,
    };
  });

  /** the selected fields, in the order of selection */
  protected readonly selected = linkedSignal<string[]>(
    () => this.initial().fields,
  );

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
    } else if (this.initial().otherDataSource !== undefined) {
      config.dataSource = this.initial().otherDataSource;
    } else {
      delete config.dataSource;
    }
  }
}
