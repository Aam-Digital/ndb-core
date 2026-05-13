import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatSort, Sort, SortDirection } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { entityFilterPredicate } from "../../filter/filter-generator/filter-predicate";
import { FilterService } from "../../filter/filter.service";
import { DataFilter } from "../../filter/filters/filters";
import { ColumnConfig, FormFieldConfig } from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import {
  buildColumnState,
  ColumnState,
  inferDefaultSort,
} from "./entities-table-state.util";
import { TableRow } from "./table-row";
import {
  areAllRowsSelected,
  isCheckboxTarget,
  isSelectionIndeterminate,
  selectAllRecords,
  toggleRecordSelection,
  updateSelectionFromMouseDown,
} from "./entities-table-selection.util";
import { tableSort } from "./table-sort/table-sort";
import { TableStateUrlService } from "./table-state-url.service";

type ReadSignal<T> = () => T;
type ModelSignal<T> = ReadSignal<T> & { set(value: T): void };

const EMPTY_COLUMN_STATE: ColumnState = {
  customColumns: [],
  columns: [],
  columnsToDisplay: [],
  idForSavingPagination: "",
};

/**
 * Input and model signals consumed by `EntitiesTableStore`.
 */
export interface EntitiesTableStoreContext<T extends Entity> {
  records: ReadSignal<T[] | undefined>;
  customColumns: ReadSignal<ColumnConfig[]>;
  columnsToDisplay: ReadSignal<string[] | undefined>;
  entityType: ReadSignal<EntityConstructor<T> | undefined>;
  sortBy: ReadSignal<Sort | undefined>;
  filter: ReadSignal<DataFilter<T>>;
  filterFreetext: ReadSignal<string | undefined>;
  showEntityColor: ReadSignal<boolean>;
  getBackgroundColor: ReadSignal<((rec: T) => string) | undefined>;
  selectable: ReadSignal<boolean>;
  editable: ReadSignal<boolean>;
  selectedRecords: ModelSignal<T[]>;
  showInactive: ModelSignal<boolean>;
  actionColumnSelect: string;
  actionColumnEdit: string;
}

/**
 * Component-scoped signal store for entities-table state derivation and interaction logic.
 */
@Injectable()
export class EntitiesTableStore<T extends Entity> {
  private readonly filterService = inject(FilterService);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly entityFormService = inject(EntityFormService);
  private readonly tableStateUrl = inject(TableStateUrlService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly context = signal<EntitiesTableStoreContext<T> | null>(null);
  private readonly sortManuallySet = signal(false);
  private readonly lastSelectedRow = signal<TableRow<T> | null>(null);
  private readonly lastSelection = signal<boolean | null>(null);
  private attachedSort?: MatSort;

  /** Whether initial data load finished at least once. */
  readonly isLoading = signal(true);
  /** Currently active sort used by row ordering and table header state. */
  readonly sortState = signal<Sort>(undefined);
  /** Material table datasource kept for paginator/sort interop in the template layer. */
  readonly recordsDataSource = this.createDataSource();

  /** Full derived column state for table rendering and action columns. */
  readonly columnState = computed<ColumnState>(() => {
    const context = this.context();
    if (!context) return EMPTY_COLUMN_STATE;
    return buildColumnState({
      entityType: context.entityType(),
      customColumns: context.customColumns(),
      columnsToDisplay: context.columnsToDisplay(),
      selectable: context.selectable(),
      editable: context.editable(),
      actionColumnSelect: context.actionColumnSelect,
      actionColumnEdit: context.actionColumnEdit,
      extendFormFieldConfig: (config, entityType) =>
        this.entityFormService.extendFormFieldConfig(config, entityType),
    });
  });

  readonly customColumns = computed<FormFieldConfig[]>(
    () => this.columnState().customColumns,
  );
  /** Resolved schema + custom columns used for table cell rendering. */
  readonly columns = computed<FormFieldConfig[]>(
    () => this.columnState().columns,
  );
  /** Final displayed column IDs including internal action columns. */
  readonly columnsToDisplay = computed<string[]>(
    () => this.columnState().columnsToDisplay,
  );
  /** Stable pagination preference key derived from selected custom columns. */
  readonly idForSavingPagination = computed(
    () => this.columnState().idForSavingPagination,
  );

  /** Background-color strategy resolved from optional callback or entity color mode. */
  readonly effectiveBackgroundColor = computed<(rec: T) => string>(() => {
    const context = this.context();
    if (!context) return () => "";
    const custom = context.getBackgroundColor();
    const useEntityColor = context.showEntityColor();
    return custom ?? ((rec: T) => (useEntityColor ? rec.getColor() : ""));
  });

  readonly defaultSort = computed<Sort>(() => {
    const state = this.columnState();
    return inferDefaultSort(state.columnsToDisplay, state.columns, (dataType) =>
      this.schemaService.getDatatypeOrDefault(dataType),
    );
  });

  readonly effectiveFilter = computed<DataFilter<T>>(() => {
    const context = this.context();
    if (!context) return {} as DataFilter<T>;
    const nextFilter = { ...context.filter() };
    if (context.showInactive()) {
      delete nextFilter["isActive"];
    } else {
      nextFilter["isActive"] = true;
    }
    return nextFilter;
  });

  readonly filteredRecords = computed<T[]>(() => {
    const context = this.context();
    if (!context) return [];

    const records = context.records() ?? [];
    const predicate = this.filterService.getFilterPredicate(
      this.effectiveFilter(),
    );
    const domainFiltered = records.filter(predicate);

    const freetext = context.filterFreetext() ?? "";
    if (!freetext) {
      return domainFiltered;
    }

    return domainFiltered.filter((record) =>
      entityFilterPredicate(record, freetext),
    );
  });

  readonly sortedRows = computed<TableRow<T>[]>(() => {
    const rows = this.filteredRecords().map((record) => ({ record }));
    const sort = this.sortState() ?? this.defaultSort();

    if (!sort?.active || !sort.direction) {
      return rows;
    }

    return tableSort<T, keyof T>(rows, {
      active: sort.active as keyof T,
      direction: sort.direction,
    });
  });

  readonly allRowsSelected = computed(() => {
    const context = this.context();
    if (!context) return false;
    return areAllRowsSelected(
      context.selectedRecords(),
      this.sortedRows().length,
    );
  });

  readonly selectionIndeterminate = computed(() => {
    const context = this.context();
    if (!context) return false;
    return isSelectionIndeterminate(
      context.selectedRecords(),
      this.sortedRows().length,
    );
  });

  constructor() {
    effect(() => {
      if (!this.context()) return;
      if (
        !this.sortManuallySet() &&
        !this.tableStateUrl.getUrlParam("sortBy")
      ) {
        this.sortState.set(this.defaultSort());
      }
    });

    effect(() => {
      const context = this.context();
      if (!context) return;
      const externalSort = context.sortBy();
      if (!externalSort) return;
      this.sortState.set(externalSort);
      if (externalSort.active) {
        this.tableStateUrl.updateUrlParams({
          sortBy: externalSort.active,
          sortOrder: externalSort.direction ?? "asc",
        });
      }
      this.sortManuallySet.set(true);
    });

    effect(() => {
      this.recordsDataSource.data = this.sortedRows();
    });

    effect(() => {
      const context = this.context();
      if (!context) return;
      const records = context.records();
      if (records !== undefined && records !== null) {
        this.isLoading.set(false);
      }
    });
  }

  /** Connects component input/model signals to this store. Must be called once from component constructor. */
  connect(context: EntitiesTableStoreContext<T>) {
    this.context.set(context);
  }

  /** Attaches `MatSort`, restores URL sort state, and keeps URL in sync with user sort changes. */
  attachSort(sort: MatSort | undefined) {
    if (!sort || this.attachedSort === sort) return;
    this.attachedSort = sort;
    this.recordsDataSource.sort = sort;

    const urlSortBy = this.tableStateUrl.getUrlParam("sortBy");
    const urlSortOrder = this.tableStateUrl.getUrlParam(
      "sortOrder",
    ) as SortDirection;
    if (urlSortBy) {
      sort.active = urlSortBy;
      sort.direction = urlSortOrder || "asc";
      this.sortState.set({ active: sort.active, direction: sort.direction });
      this.sortManuallySet.set(true);
    }

    sort.sortChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.sortState.set(value);
        this.sortManuallySet.set(true);
        this.updateSortUrlParams(value.active, value.direction);
      });
  }

  /** Selects or unselects a single row record. */
  selectRow(row: TableRow<T>, checked: boolean) {
    const context = this.getContextOrThrow();
    context.selectedRecords.set(
      toggleRecordSelection(context.selectedRecords(), row.record, checked),
    );
  }

  /** Selects or unselects all currently sorted rows. */
  selectAllRows(checked: boolean) {
    const context = this.getContextOrThrow();
    context.selectedRecords.set(selectAllRecords(this.sortedRows(), checked));
  }

  /**
   * Applies row selection interaction for mouse-down in selectable mode.
   * Returns whether the event came from a checkbox target.
   */
  handleSelectableRowMouseDown(event: MouseEvent, row: TableRow<T>): boolean {
    const context = this.getContextOrThrow();
    const selectedRows = this.getCurrentPageRows();
    const nextState = updateSelectionFromMouseDown(
      context.selectedRecords(),
      selectedRows,
      row,
      event.shiftKey,
      this.lastSelectedRow(),
      this.lastSelection(),
    );
    context.selectedRecords.set(nextState.selectedRecords);
    this.lastSelectedRow.set(nextState.lastSelectedRow);
    this.lastSelection.set(nextState.lastSelection);
    return isCheckboxTarget(event.target);
  }

  /** Returns filtered+sorted entities for consumers that emit change events. */
  getFilteredEntities(): T[] {
    return this.sortedRows().map((row) => row.record);
  }

  private createDataSource() {
    const dataSource = new MatTableDataSource<TableRow<T>>();
    dataSource.sortData = (data, sort) =>
      tableSort<T, keyof T>(data, {
        active: (sort.active as keyof T) ?? "",
        direction: sort.direction,
      });
    dataSource.filterPredicate = (data, filter) =>
      entityFilterPredicate(data.record, filter);
    return dataSource;
  }

  private getCurrentPageRows(): TableRow<T>[] {
    const rows = this.sortedRows();
    const paginator = this.recordsDataSource.paginator;
    if (!paginator) {
      return rows;
    }

    const startIndex = paginator.pageIndex * paginator.pageSize;
    return rows.slice(startIndex, startIndex + paginator.pageSize);
  }

  private updateSortUrlParams(active: string, direction: SortDirection) {
    if (!direction) {
      this.tableStateUrl.updateUrlParams({
        sortBy: null,
        sortOrder: null,
      });
      return;
    }

    if (direction === "desc") {
      this.tableStateUrl.updateUrlParams({
        sortBy: active,
        sortOrder: "desc",
      });
      return;
    }

    this.tableStateUrl.updateUrlParams({
      sortBy: active,
      sortOrder: null,
    });
  }

  private getContextOrThrow(): EntitiesTableStoreContext<T> {
    const context = this.context();
    if (!context) {
      throw new Error(
        "EntitiesTableStore must be connected before interaction",
      );
    }
    return context;
  }
}
