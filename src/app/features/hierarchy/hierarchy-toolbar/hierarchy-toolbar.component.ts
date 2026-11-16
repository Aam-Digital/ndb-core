import { Component, computed, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { HierarchyDataSource, NO_HIERARCHY } from "../hierarchy-data-source";

/**
 * The hierarchy control of a list: a button with a menu to choose the field to arrange the records by
 * (or a flat list), joined with a button to collapse or expand all records with sub-records.
 * A toolbar control of the {@link HierarchyDataSource}, placed after the filters (on desktop).
 */
@Component({
  selector: "app-hierarchy-toolbar",
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    FaDynamicIconComponent,
  ],
  templateUrl: "./hierarchy-toolbar.component.html",
  styleUrl: "./hierarchy-toolbar.component.scss",
})
export class HierarchyToolbarComponent {
  dataSource = input.required<HierarchyDataSource<Entity>>();

  protected readonly options = computed(() => {
    const schema = this.dataSource().loadRecordConfig()?.entityCtr?.schema;
    return [
      ...this.dataSource()
        .hierarchyFields()
        .map((id) => ({ id, label: schema?.get(id)?.label ?? id })),
      {
        id: NO_HIERARCHY,
        label: $localize`:hierarchy|Option of the Hierarchy menu to show a list without hierarchy:None (flat list)`,
      },
    ];
  });

  protected readonly selected = computed(
    () => this.dataSource().activeField() ?? NO_HIERARCHY,
  );

  protected readonly selectedLabel = computed(() =>
    this.selected() === NO_HIERARCHY
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

  protected select(value: string) {
    this.dataSource().selectField(value === NO_HIERARCHY ? undefined : value);
  }
}
