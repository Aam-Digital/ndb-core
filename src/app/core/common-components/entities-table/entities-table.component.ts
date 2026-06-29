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
  ViewChild,
} from "@angular/core";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSort, MatSortModule, Sort } from "@angular/material/sort";
import {
  MatColumnDef,
  MatTable,
  MatTableModule,
} from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { Router } from "@angular/router";
import { EntityFieldEditComponent } from "../../entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "../../entity/entity-field-label/entity-field-label.component";
import { EntityFieldViewComponent } from "../../entity/entity-field-view/entity-field-view.component";
import { getEntityRuntimeRoute } from "../../entity/entity-config.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
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
import {
  EntitiesTableSelectionStore,
  shouldSkipRowInteraction,
} from "./entities-table-selection";
import { EntitiesTableDataSource } from "./entities-table-data-source";
import { InMemoryDataSource } from "./in-memory-data-source";

/**
 * A reusable table component for displaying, sorting, filtering, and selecting entities.
 *
 * Data handling (loading, filtering, sorting, pagination) is delegated to an
 * {@link EntitiesTableDataSource} implementation.  By default the component
 * creates an {@link InMemoryDataSource} internally when the `records` input is
 * used (backward-compatible path).  Pass a `dataSource` input to use a
 * pre-configured data source (e.g. one that already auto-loads from
 * EntityMapper, or a future server-side paginated source).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entities-table",
  providers: [EntitiesTableSelectionStore],
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
  private readonly entityFormService = inject(EntityFormService);
  protected readonly selectionStore = inject(
    EntitiesTableSelectionStore,
  ) as EntitiesTableSelectionStore<T>;

  // --- Inputs ---
  /** External data source (new API). When set, takes precedence over `records`. */
  dataSource = input<EntitiesTableDataSource<T>>();
  /** Raw entity records (backward-compat API). Creates an internal InMemoryDataSource. */
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

  /** All column definitions merged from entity schema + custom columns. */
  private readonly _allColumns = computed<FormFieldConfig[]>(() => {
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
  });

  readonly idForSavingPagination = computed(() =>
    this._customColumns()
      .map((column) => column.id)
      .join(""),
  );

  // --- Background color ---
  readonly effectiveBackgroundColor = computed<(rec: T) => string>(() => {
    const custom = this.getBackgroundColor();
    const useEntityColor = this.showEntityColor();
    return custom ?? ((rec: T) => (useEntityColor ? rec.getColor() : ""));
  });

  // --- Data source ---
  /**
   * Internal data source used when only the `records` input is provided.
   * Created eagerly because inject() is only available during construction.
   */
  private readonly _internalDataSource = new InMemoryDataSource<T>();

  /** The active data source: external input takes precedence over the internal one. */
  readonly activeDataSource = computed<EntitiesTableDataSource<T>>(
    () => this.dataSource() ?? this._internalDataSource,
  );

  /** Columns with sorting rules applied, as provided by the active data source. */
  readonly _columns = computed<FormFieldConfig[]>(
    () => this.activeDataSource().columns(),
  );

  private _paginator?: MatPaginator;

  @ViewChild(MatTable, { static: true }) table: MatTable<T>;
  @ContentChildren(MatColumnDef) projectedColumns: QueryList<MatColumnDef>;

  @ViewChild(MatSort, { static: false }) set sort(sort: MatSort) {
    if (sort) {
      this.activeDataSource().attachSort(sort);
    }
  }

  constructor() {
    // Connect column definitions to the internal data source upfront.
    this._internalDataSource.connectColumns(
      this._columnsToDisplay,
      this._allColumns,
      this.sortBy,
    );

    // When an external dataSource input is set, connect columns to it too.
    effect(() => {
      const ds = this.dataSource();
      if (ds) {
        ds.connectColumns(
          this._columnsToDisplay,
          this._allColumns,
          this.sortBy,
        );
      }
    });

    // Keep filter/freetext/showInactive inputs in sync with the data source
    effect(() => {
      this.activeDataSource().filter.set(this.filter());
    });
    effect(() => {
      this.activeDataSource().filterFreetext.set(this.filterFreetext() ?? "");
    });
    effect(() => {
      this.activeDataSource().showInactive.set(this.showInactive());
    });
    // Write-back: keep the model in sync if the data source changes showInactive
    effect(() => {
      this.showInactive.set(this.activeDataSource().showInactive());
    });

    // When `records` input is provided, push them into the internal data source
    effect(() => {
      const records = this.records();
      if (records !== undefined) {
        this._internalDataSource.allRecords.set(records);
      }
    });

    // Connect selection store
    this.selectionStore.connect({
      selectedRecords: this.selectedRecords,
      sortedRows: computed(() => this.activeDataSource().sortedRows()),
      getCurrentPageRows: () => this.getCurrentPageRows(),
    });

    // Emit filtered records changes
    effect(() => {
      this.filteredRecordsChange.emit(
        this.activeDataSource()
          .sortedRows()
          .map((row) => row.record),
      );
    });
  }

  ngAfterContentInit() {
    this.projectedColumns.forEach((columnDef) =>
      this.table.addColumnDef(columnDef),
    );
  }

  onPaginatorReady(paginator: MatPaginator): void {
    this._paginator = paginator;
    this.activeDataSource().attachPaginator(paginator);
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
    const rows = this.activeDataSource().sortedRows();
    const p = this._paginator;
    if (!p) return rows;
    const start = p.pageIndex * p.pageSize;
    return rows.slice(start, start + p.pageSize);
  }
}
