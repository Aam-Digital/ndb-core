import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterComponent } from "../../filter/filter/filter.component";
import { MatTab, MatTabGroup } from "@angular/material/tabs";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { EntityConstructor } from "../../entity/model/entity";
import { EntityListConfig } from "../../entity-list/EntityListConfig";
import { EntityFieldsMenuComponent } from "../../common-components/entity-fields-menu/entity-fields-menu.component";
import { ColumnConfig } from "../../common-components/entity-form/FormConfig";
import { MatTableModule } from "@angular/material/table";
import { EntityFieldLabelComponent } from "../../common-components/entity-field-label/entity-field-label.component";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatIconButton } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatSelect } from "@angular/material/select";

@Component({
  selector: "app-admin-entity-list",
  standalone: true,
  imports: [
    CommonModule,
    FilterComponent,
    MatTabGroup,
    EntitiesTableComponent,
    MatTab,
    EntityFieldsMenuComponent,
    MatTableModule,
    EntityFieldLabelComponent,
    CdkDrag,
    FaIconComponent,
    MatIconButton,
    CdkDropList,
    MatFormField,
    MatLabel,
    MatSelect,
  ],
  templateUrl: "./admin-entity-list.component.html",
  styleUrl: "./admin-entity-list.component.scss",
})
export class AdminEntityListComponent implements OnChanges {
  @Input() entityConstructor: EntityConstructor;
  @Input() config: EntityListConfig;

  allFields: ColumnConfig[] = [];
  filters: string[];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      this.config = this.config ?? {
        entity: this.entityConstructor.ENTITY_TYPE,
      };
      this.config.filters = this.config.filters ?? [];

      this.initColumnGroupsIfNecessary();

      this.initAvailableFields();
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

  private initAvailableFields() {
    this.allFields = [
      ...(this.config.columns ?? []),
      ...this.entityConstructor.schema.keys(),
    ];
    this.filters = (this.config.filters ?? []).map((f) => f.id);
  }

  updateFilters(filters: string[]) {
    this.filters = filters;
    this.config.filters = filters.map(
      (f) =>
        this.config.filters.find(
          (existingFilter) => existingFilter.id === f,
        ) ?? { id: f },
    );
  }

  removeItem<E>(array: E[], item: E) {
    array.splice(array.indexOf(item), 1);
  }

  drop<E>(event: CdkDragDrop<E[], any>, columnsArray: E[]) {
    moveItemInArray(columnsArray, event.previousIndex, event.currentIndex);
  }
}
