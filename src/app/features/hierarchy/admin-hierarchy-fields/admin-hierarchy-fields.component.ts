import { Component, computed, input, linkedSignal } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntityListConfig } from "#src/app/core/entity-list/EntityListConfig";
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
  template: `
    @if (candidates().length > 0) {
      <mat-form-field class="hierarchy-fields">
        <mat-label
          i18n="
            admin list view|Label of the setting to show the list as a hierarchy
            by link fields
          "
          >Hierarchy displayed by</mat-label
        >
        <mat-select
          multiple
          [value]="selected()"
          (valueChange)="select($event)"
        >
          @for (option of candidates(); track option.id) {
            <mat-option [value]="option.id">{{ option.label }}</mat-option>
          }
        </mat-select>
        <app-fa-dynamic-icon
          matIconSuffix
          icon="question-circle"
          class="hint-icon"
          matTooltip="Show records indented below the record they link to through this field. Users can switch between the selected fields; the first one is shown by default."
          i18n-matTooltip="admin list view|Explanation of the hierarchy setting"
        ></app-fa-dynamic-icon>
      </mat-form-field>
    }
  `,
  styles: `
    .hierarchy-fields {
      min-width: 300px;
    }
    .hint-icon {
      padding-inline: 8px;
    }
  `,
})
export class AdminHierarchyFieldsComponent {
  entityConstructor = input.required<EntityConstructor>();
  /** the list config, updated in place */
  config = input.required<EntityListConfig>();

  /** link fields to one record of the same type, in the order of the schema */
  protected readonly candidates = computed(() =>
    getHierarchyFieldCandidates(this.entityConstructor()).map((id) => ({
      id,
      label: this.entityConstructor().schema.get(id)?.label ?? id,
    })),
  );

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
