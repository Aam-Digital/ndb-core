import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChildren,
  effect,
  inject,
  input,
  model,
  output,
  QueryList,
  signal,
  ViewChild,
} from "@angular/core";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import {
  MatColumnDef,
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from "@angular/material/table";
import { Router } from "@angular/router";
import { EntityFieldEditComponent } from "../../entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "../../entity/entity-field-label/entity-field-label.component";
import { EntityFieldViewComponent } from "../../entity/entity-field-view/entity-field-view.component";
import { getEntityRuntimeRoute } from "../../entity/entity-config.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { entityFilterPredicate } from "../../filter/filter-generator/filter-predicate";
import { FilterService } from "../../filter/filter.service";
import { DataFilter } from "../../filter/filters/filters";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { EntityCreateButtonComponent } from "../entity-create-button/entity-create-button.component";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { EntityInlineEditActionsComponent } from "./entity-inline-edit-actions/entity-inline-edit-actions.component";
import { ListPaginatorComponent } from "./list-paginator/list-paginator.component";
import { TableRow } from "./table-row";
import { tableSort } from "./table-sort/table-sort";
import {
  EntitiesTableSelectionStore,
  shouldSkipRowInteraction,
} from "./entities-table-selection";
import { EntitiesTableSortStore } from "./entities-table-sort.store";
import { PaginatedDataSource } from "#src/app/core/common-components/entities-table/paginated-data-source";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";

/**
 * A reusable table component for displaying, sorting, filtering, and selecting entities.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entities-table",
  providers: [EntitiesTableSortStore, EntitiesTableSelectionStore],
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
  private readonly entityMapper = inject(EntityMapperService);
  private readonly formDialog = inject(FormDialogService);
  private readonly router = inject(Router);
  private readonly filterService = inject(FilterService);
  private readonly entityFormService = inject(EntityFormService);
  protected readonly sortStore = inject(
    EntitiesTableSortStore,
  ) as EntitiesTableSortStore<T>;
  protected readonly selectionStore = inject(
    EntitiesTableSelectionStore,
  ) as EntitiesTableSelectionStore<T>;

  // --- Inputs ---
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

  // --- Outputs & Models ---
  filteredRecordsChange = output<T[]>();
  entityClick = output<T>();
  selectedRecords = model<T[]>([]);
  showInactive = model<boolean>(false);

  // --- Internal constants ---
  readonly ACTIONCOLUMN_SELECT = "__select";
  readonly ACTIONCOLUMN_EDIT = "__edit";

  // --- Column state ---
  readonly _customColumns = computed<FormFieldConfig[]>(() =>
    this.customColumns().map((column) => {
      const entityType = this.entityType();
      return entityType
        ? this.entityFormService.extendFormFieldConfig(column, entityType)
        : toFormFieldConfig(column);
    }),
  );
  readonly _columnsToDisplay = computed<string[]>(() => {
    let colsToDisplay = this.columnsToDisplay();
    if (!colsToDisplay || colsToDisplay.length === 0) {
      colsToDisplay = this._customColumns()
        .filter((column) => !column.hideFromTable)
        .map((column) => column.id);
    }
    const columns = colsToDisplay.filter((col) => !col.startsWith("__"));
    if (this.selectable()) {
      columns.unshift(this.ACTIONCOLUMN_SELECT);
    }
    if (this.editable()) {
      columns.splice(this.selectable() ? 1 : 0, 0, this.ACTIONCOLUMN_EDIT);
    }
    return columns;
  });
  /** Columns with sorting rules applied (managed by the sort store). */
  readonly _columns = this.sortStore.columns;
  readonly idForSavingPagination = computed(() =>
    this._customColumns()
      .map((column) => column.id)
      .join(""),
  );

  // --- Filtering (stateless derivation) ---
  readonly effectiveFilter = computed<DataFilter<T>>(() => {
    const nextFilter = { ...this.filter() };
    if (this.showInactive()) {
      delete nextFilter["isActive"];
    } else {
      nextFilter["isActive"] = true;
    }
    return nextFilter;
  });

  readonly filteredRecords = computed<T[]>(() => {
    const records = this.records() ?? [];
    const predicate = this.filterService.getFilterPredicate(
      this.effectiveFilter(),
    );
    if (this.recordsDataSource instanceof PaginatedDataSource) {
      this.recordsDataSource.dataFiler = this.effectiveFilter();
    }
    const domainFiltered = records.filter(predicate);

    const freetext = this.filterFreetext() ?? "";
    if (!freetext) {
      return domainFiltered;
    }
    return domainFiltered.filter((record) =>
      entityFilterPredicate(record, freetext),
    );
  });

  // --- Background color ---
  readonly effectiveBackgroundColor = computed<(rec: T) => string>(() => {
    const custom = this.getBackgroundColor();
    const useEntityColor = this.showEntityColor();
    return custom ?? ((rec: T) => (useEntityColor ? rec.getColor() : ""));
  });

  // --- Loading state ---
  readonly isLoading = signal(true);

  // --- Material DataSource (for paginator interop) ---
  recordsDataSource: MatTableDataSource<TableRow<T>>;

  @ViewChild(MatTable, { static: true }) table: MatTable<T>;
  @ContentChildren(MatColumnDef) projectedColumns: QueryList<MatColumnDef>;

  @ViewChild(MatSort, { static: false }) set sort(sort: MatSort) {
    this.sortStore.attachSort(sort);
    if (sort) {
      this.recordsDataSource.sort = sort;
    }
  }

  constructor() {
    // Connect sort store
    this.sortStore.connect({
      columnsToDisplay: this._columnsToDisplay,
      columns: computed(() => {
        const mappedCustomColumns = this._customColumns();
        const entityType = this.entityType();
        const entityColumns = entityType?.schema
          ? [...entityType.schema.entries()].map(
              ([id, field]) => ({ ...field, id }) as FormFieldConfig,
            )
          : [];
        return [
          ...entityColumns.filter(
            (col) =>
              !mappedCustomColumns.some((custom) => custom.id === col.id),
          ),
          ...mappedCustomColumns,
        ];
      }),
      externalSort: this.sortBy,
      filteredRecords: this.filteredRecords,
    });

    // Connect selection store
    this.selectionStore.connect({
      selectedRecords: this.selectedRecords,
      sortedRows: this.sortStore.sortedRows,
      getCurrentPageRows: () => this.getCurrentPageRows(),
    });

    // Sync sorted rows to Material DataSource
    effect(() => {
      // this.recordsDataSource.data = this.sortStore.sortedRows();
    });

    effect(() => {
      this.recordsDataSource = this.createDataSource();
    });

    // Track loading state
    effect(() => {
      const records = this.records();
      if (records !== undefined && records !== null) {
        this.isLoading.set(false);
      }
    });

    // Emit filtered records changes
    effect(() => {
      this.filteredRecordsChange.emit(
        this.sortStore.sortedRows().map((row) => row.record),
      );
    });
  }

  ngAfterContentInit() {
    this.projectedColumns.forEach((columnDef) =>
      this.table.addColumnDef(columnDef),
    );
  }

  onRowClick(row: TableRow<T>, event: MouseEvent) {
    if (shouldSkipRowInteraction(event.target, row)) {
      return;
    }
    if (this.selectable()) {
      this.selectionStore.selectRow(
        row,
        !this.selectedRecords()?.includes(row.record),
      );
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

    if (this.selectionStore.handleSelectableRowMouseDown(event, row)) {
      this.onRowClick(row, event);
    }
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
        this.router.navigate([
          getEntityRuntimeRoute(entity.getConstructor()),
          entity.isNew ? "new" : entity.getId(true),
        ]);
        break;
    }
  }

  getCurrentPageRows(): TableRow<T>[] {
    const rows = this.sortStore.sortedRows();
    const paginator = this.recordsDataSource.paginator;
    if (!paginator) {
      return rows;
    }

    const startIndex = paginator.pageIndex * paginator.pageSize;
    return rows.slice(startIndex, startIndex + paginator.pageSize);
  }

  private createDataSource() {
    const dataSource = new PaginatedDataSource<T>(
      this.entityType(),
      this.entityMapper,
    );
    dataSource.sortData = (data, sort) =>
      tableSort<T, keyof T>(data, {
        active: (sort.active as keyof T) ?? "",
        direction: sort.direction,
        sortValueFns: this.sortStore.sortValueFns(),
      });
    dataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
    return dataSource;
  }
}
