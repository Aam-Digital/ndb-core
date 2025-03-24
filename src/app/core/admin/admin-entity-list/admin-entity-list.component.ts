import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityConstructor } from "../../entity/model/entity";
import {
  EntityListConfig,
  GroupConfig,
} from "../../entity-list/EntityListConfig";
import { EntityFieldsMenuComponent } from "../../common-components/entity-fields-menu/entity-fields-menu.component";
import { ColumnConfig } from "../../common-components/entity-form/FormConfig";
import { MatTableModule } from "@angular/material/table";
import { EntityFieldLabelComponent } from "../../common-components/entity-field-label/entity-field-label.component";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragEnter,
  CdkDropList,
  CdkDropListGroup,
  DragRef,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatSelect } from "@angular/material/select";
import { AdminTabsComponent } from "../building-blocks/admin-tabs/admin-tabs.component";
import { AdminTabTemplateDirective } from "../building-blocks/admin-tabs/admin-tab-template.directive";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";

@Component({
  selector: "app-admin-entity-list",
  imports: [
    CommonModule,
    EntityFieldsMenuComponent,
    MatTableModule,
    EntityFieldLabelComponent,
    CdkDrag,
    FaIconComponent,
    CdkDropList,
    MatFormField,
    MatLabel,
    MatSelect,
    AdminTabsComponent,
    AdminTabTemplateDirective,
    ViewTitleComponent,
  ],
  templateUrl: "./admin-entity-list.component.html",
  styleUrls: [
    "./admin-entity-list.component.scss",
    "../admin-entity/admin-entity-styles.scss",
  ],
})
export class AdminEntityListComponent implements OnChanges {
  @Input() entityConstructor: EntityConstructor;
  @Input() config: EntityListConfig;

  allFields: ColumnConfig[] = [];
  filters: string[];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      this.config = this.config ?? {
        entityType: this.entityConstructor.ENTITY_TYPE,
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

  newColumnGroupFactory(): GroupConfig {
    return { name: "", columns: [] };
  }

  removeItem<E>(array: E[], item: E) {
    array.splice(array.indexOf(item), 1);
  }

  drop<E>(event: CdkDragDrop<E[], any>, columnsArray: E[]) {
    moveItemInArray(columnsArray, event.previousIndex, event.currentIndex);
  }
}
