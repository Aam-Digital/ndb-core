import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  effect,
  inject,
  input,
  model,
  output,
  QueryList,
  ViewChild,
} from "@angular/core";
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from "@angular/material/checkbox";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import {
  MatColumnDef,
  MatTable,
  MatTableModule,
} from "@angular/material/table";
import { Router } from "@angular/router";
import { EntityFieldEditComponent } from "../../entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "../../entity/entity-field-label/entity-field-label.component";
import { EntityFieldViewComponent } from "../../entity/entity-field-view/entity-field-view.component";
import { getEntityRuntimeRoute } from "../../entity/entity-config.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { DataFilter } from "../../filter/filters/filters";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { EntityCreateButtonComponent } from "../entity-create-button/entity-create-button.component";
import { ColumnConfig } from "../entity-form/FormConfig";
import { EntityInlineEditActionsComponent } from "./entity-inline-edit-actions/entity-inline-edit-actions.component";
import { ListPaginatorComponent } from "./list-paginator/list-paginator.component";
import { TableRow } from "./table-row";
import { shouldSkipRowInteraction } from "./entities-table-selection.util";
import { EntitiesTableStore } from "./entities-table.store";

/**
 * A simple display component (no logic and transformations) to display a table of entities.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entities-table",
  providers: [EntitiesTableStore],
  imports: [
    EntityFieldEditComponent,
    EntityFieldLabelComponent,
    EntityFieldViewComponent,
    ListPaginatorComponent,
    MatCheckboxModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    EntityInlineEditActionsComponent,
    EntityCreateButtonComponent,
  ],
  templateUrl: "./entities-table.component.html",
  styleUrl: "./entities-table.component.scss",
})
export class EntitiesTableComponent<
  T extends Entity,
> implements AfterContentInit {
  private readonly formDialog = inject(FormDialogService);
  private readonly router = inject(Router);
  private readonly tableStore = inject(
    EntitiesTableStore,
  ) as EntitiesTableStore<T>;

  records = input<T[]>();
  customColumns = input<ColumnConfig[], ColumnConfig[] | undefined>([], {
    transform: (value) => value ?? [],
  });
  columnsToDisplay = input<string[]>();
  entityType = input<EntityConstructor<T>>();
  sortBy = input<Sort>();
  filter = input<DataFilter<T>, DataFilter<T> | undefined>(
    {},
    {
      transform: (value) => value ?? {},
    },
  );
  filterFreetext = input<string>();
  showEntityColor = input<boolean>(false);
  getBackgroundColor = input<(rec: T) => string>();
  clickMode = input<"popup" | "navigate" | "popup-details" | "none">("popup");
  newRecordFactory = input<() => T>();
  editable = input<boolean>(true);
  selectable = input<boolean>(false);

  filteredRecordsChange = output<T[]>();
  entityClick = output<T>();
  selectedRecords = model<T[]>([]);
  showInactive = model<boolean>(false);

  readonly recordsDataSource = this.tableStore.recordsDataSource;
  readonly effectiveBackgroundColor = this.tableStore.effectiveBackgroundColor;
  readonly _customColumns = this.tableStore.customColumns;
  readonly _columns = this.tableStore.columns;
  readonly _columnsToDisplay = this.tableStore.columnsToDisplay;
  readonly idForSavingPagination = this.tableStore.idForSavingPagination;
  readonly isLoading = this.tableStore.isLoading;
  readonly _sortBy = this.tableStore.sortState;
  readonly allRowsSelected = this.tableStore.allRowsSelected;
  readonly selectionIndeterminate = this.tableStore.selectionIndeterminate;

  @ViewChild(MatTable, { static: true }) table: MatTable<T>;
  @ContentChildren(MatColumnDef) projectedColumns: QueryList<MatColumnDef>;

  ngAfterContentInit() {
    // dynamically add columns from content-projection (https://stackoverflow.com/a/58017564/1473411)
    this.projectedColumns.forEach((columnDef) =>
      this.table.addColumnDef(columnDef),
    );
  }

  @ViewChild(MatSort, { static: false }) set sort(sort: MatSort) {
    this.tableStore.attachSort(sort);
  }

  readonly ACTIONCOLUMN_SELECT = "__select";
  readonly ACTIONCOLUMN_EDIT = "__edit";

  constructor() {
    this.tableStore.connect({
      records: this.records,
      customColumns: this.customColumns,
      columnsToDisplay: this.columnsToDisplay,
      entityType: this.entityType,
      sortBy: this.sortBy,
      filter: this.filter,
      filterFreetext: this.filterFreetext,
      showEntityColor: this.showEntityColor,
      getBackgroundColor: this.getBackgroundColor,
      selectable: this.selectable,
      editable: this.editable,
      selectedRecords: this.selectedRecords,
      showInactive: this.showInactive,
      actionColumnSelect: this.ACTIONCOLUMN_SELECT,
      actionColumnEdit: this.ACTIONCOLUMN_EDIT,
    });

    effect(() => {
      this.filteredRecordsChange.emit(this.tableStore.getFilteredEntities());
    });
  }

  selectRow(row: TableRow<T>, checked: boolean) {
    this.tableStore.selectRow(row, checked);
  }

  onRowClick(row: TableRow<T>, event: MouseEvent) {
    if (shouldSkipRowInteraction(event.target, row)) {
      return;
    }
    if (this.selectable()) {
      this.selectRow(row, !this.selectedRecords()?.includes(row.record));
      return;
    }
    this.showEntity(row.record);
    this.entityClick.emit(row.record);
  }

  onRowMouseDown(event: MouseEvent, row: TableRow<T>) {
    if (!this.selectable()) {
      this.onRowClick(row, event);
      return;
    }

    if (this.tableStore.handleSelectableRowMouseDown(event, row)) {
      this.onRowClick(row, event);
    }
  }

  onRowSelect(event: MatCheckboxChange, row: TableRow<T>) {
    this.selectRow(row, event.checked);
  }

  selectAllRows(event: MatCheckboxChange) {
    this.tableStore.selectAllRows(event.checked);
  }

  showEntity(entity: T) {
    switch (this.clickMode()) {
      case "popup":
        this.formDialog.openFormPopup(entity, this._customColumns());
        break;
      case "popup-details":
        this.formDialog.openView(entity, "EntityDetails");
        break;
      case "navigate":
        this.router.navigate(this.buildEntityNavigationCommands(entity));
        break;
    }
  }

  private buildEntityNavigationCommands(entity: T): string[] {
    return [
      getEntityRuntimeRoute(entity.getConstructor()),
      entity.isNew ? "new" : entity.getId(true),
    ];
  }
}
