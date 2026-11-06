import { Component, computed, input } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { Entity } from "#src/app/core/entity/model/entity";
import { HierarchyDataSource, NO_HIERARCHY } from "../hierarchy-data-source";

/**
 * The "Hierarchy" dropdown of a list: choose the field to arrange the records by, or a flat list.
 * A toolbar control of the {@link HierarchyDataSource}.
 */
@Component({
  selector: "app-hierarchy-select",
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field class="hierarchy-select">
      <mat-label
        i18n="
          hierarchy|Label of the dropdown to choose the field by which a list is
          shown as a hierarchy
        "
        >Hierarchy</mat-label
      >
      <mat-select [value]="selected()" (valueChange)="select($event)">
        @for (option of options(); track option.id) {
          <mat-option [value]="option.id">{{ option.label }}</mat-option>
        }
        <mat-option
          [value]="noHierarchy"
          i18n="
            hierarchy|Option of the Hierarchy dropdown to show a list without
            hierarchy
          "
          >None (flat list)</mat-option
        >
      </mat-select>
    </mat-form-field>
  `,
  styles: `
    .hierarchy-select {
      width: 200px;
    }
  `,
})
export class HierarchySelectComponent {
  dataSource = input.required<HierarchyDataSource<Entity>>();

  protected readonly noHierarchy = NO_HIERARCHY;

  protected readonly options = computed(() => {
    const schema = this.dataSource().loadRecordConfig()?.entityCtr?.schema;
    return this.dataSource()
      .hierarchyFields()
      .map((id) => ({ id, label: schema?.get(id)?.label ?? id }));
  });

  protected readonly selected = computed(
    () => this.dataSource().activeField() ?? NO_HIERARCHY,
  );

  protected select(value: string) {
    this.dataSource().selectField(value === NO_HIERARCHY ? undefined : value);
  }
}
