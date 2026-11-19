import { Component, computed, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { resolveLocaleText } from "#src/app/core/language/active-locale";
import { HierarchyDataSource } from "../hierarchy-data-source";

/**
 * The hierarchy control of a list: a button with a menu to choose the field to arrange the records by
 * (or a flat list), joined with a button to collapse or expand all records with sub-records.
 * A toolbar control of the {@link HierarchyDataSource}, placed after the filters (on desktop).
 */
@Component({
  selector: "app-hierarchy-toolbar",
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    FaDynamicIconComponent,
  ],
  templateUrl: "./hierarchy-toolbar.component.html",
  styleUrl: "./hierarchy-toolbar.component.scss",
})
export class HierarchyToolbarComponent {
  dataSource = input.required<HierarchyDataSource<Entity>>();

  /** title of the menu, also its accessible name */
  protected readonly menuTitle = $localize`:hierarchy|Title of the menu to choose the field by which a list is shown as a hierarchy:Show hierarchy based on field`;

  /**
   * the options of the menu, each with a line explaining how it arranges the records:
   * the hierarchy fields and `null` for the flat list (a field could have any id)
   */
  protected readonly options = computed<HierarchyMenuOption[]>(() => {
    const schema = this.dataSource().loadRecordConfig()?.entityCtr?.schema;
    return [
      ...this.dataSource()
        .hierarchyFields()
        .map((id) => {
          const label = resolveLocaleText(schema?.get(id)?.label) ?? id;
          return {
            id,
            label,
            hint: $localize`:hierarchy|Explanation of an option of the Hierarchy menu, followed by the name of a field:Indented below the record in "${label}:fieldLabel:"`,
          };
        }),
      {
        id: null,
        label: $localize`:hierarchy|Option of the Hierarchy menu to show a list without hierarchy:None (flat list)`,
        hint: $localize`:hierarchy|Explanation of the option of the Hierarchy menu to show a list without hierarchy:All records in one list without indentation`,
      },
    ];
  });

  protected readonly selected = computed(
    () => this.dataSource().activeField() ?? null,
  );

  protected readonly selectedLabel = computed(() =>
    this.selected() === null
      ? $localize`:hierarchy|Label of the Hierarchy button while a list is shown without hierarchy:Flat list`
      : this.options().find((option) => option.id === this.selected())?.label,
  );

  /** the "Collapse all" / "Expand all" button, only while the list is arranged as a hierarchy */
  protected readonly expandToggle = computed(() => {
    const dataSource = this.dataSource();
    if (!dataSource.activeField()) {
      return undefined;
    }
    return dataSource.anyExpanded()
      ? {
          icon: "down-left-and-up-right-to-center",
          label: $localize`:hierarchy|Button to hide all sub-records of a list:Collapse all`,
          action: () => dataSource.collapseAll(),
        }
      : {
          icon: "up-right-and-down-left-from-center",
          label: $localize`:hierarchy|Button to show all sub-records of a list:Expand all`,
          action: () => dataSource.expandAll(),
        };
  });

  protected select(field: string | null) {
    this.dataSource().selectField(field ?? undefined);
  }
}

interface HierarchyMenuOption {
  id: string | null;
  label: string;
  hint: string;
}
