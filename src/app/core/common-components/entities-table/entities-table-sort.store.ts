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
import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { Entity } from "../../entity/model/entity";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { FormFieldConfig } from "../entity-form/FormConfig";
import { TableRow } from "./table-row";
import { SortValueFns, tableSort } from "./table-sort/table-sort";
import { TableStateUrlService } from "./table-state-url.service";

type ReadSignal<T> = () => T;

/**
 * Input signals consumed by `EntitiesTableSortStore`.
 */
export interface EntitiesTableSortContext<T extends Entity = Entity> {
  /** Visible column IDs (updated reactively). */
  columnsToDisplay: ReadSignal<string[]>;
  /** Full column definitions (updated reactively). */
  columns: ReadSignal<FormFieldConfig[]>;
  /** External sort override from a component input binding. */
  externalSort: ReadSignal<Sort | undefined>;
  /** Filtered records to be sorted. */
  filteredRecords: ReadSignal<T[]>;
}

/**
 * Component-scoped store that manages table sort state, MatSort binding,
 * and URL query-param persistence.
 */
@Injectable()
export class EntitiesTableSortStore<T extends Entity = Entity> {
  private readonly tableStateUrl = inject(TableStateUrlService);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly destroyRef = inject(DestroyRef);

  private context: EntitiesTableSortContext<T> | null = null;
  private readonly sortManuallySet = signal(false);
  private attachedSort?: MatSort;

  /** Explicitly set sort (via user interaction, URL state, or external input). */
  readonly sortState = signal<Sort>(undefined);

  /**
   * Columns with sorting rules applied.
   * Disables sorting for entity references, untyped columns, and arrays
   * (unless the array's datatype provides custom sort logic).
   */
  readonly columns = computed<FormFieldConfig[]>(() => {
    if (!this.context) return [];
    return applySortingRules(this.context.columns(), (dataType) =>
      this.schemaService.getDatatypeOrDefault(dataType, true),
    );
  });

  /**
   * Default sort inferred from visible sortable columns.
   * Recomputed whenever columns or columnsToDisplay change.
   */
  readonly defaultSort = computed<Sort | undefined>(() => {
    if (!this.context) return undefined;
    return inferDefaultSort(
      this.context.columnsToDisplay(),
      this.columns(),
      (dataType) => this.schemaService.getDatatypeOrDefault(dataType),
    );
  });

  /**
   * Effective sort used for row ordering — falls back to the default sort
   * inferred from columns when no explicit sort has been set.
   */
  readonly effectiveSort = computed<Sort | undefined>(
    () => this.sortState() ?? this.defaultSort(),
  );

  /**
   * Map of column id → sort value extractor built from datatype metadata.
   * Datatypes that override `sortValue` provide custom sort logic;
   * others return `undefined` and fall back to default sorting in `tableSort`.
   */
  readonly sortValueFns = computed<SortValueFns<T>>(() => {
    if (!this.context) return {};
    const fns: SortValueFns<T> = {};
    for (const col of this.context.columns()) {
      const datatype = this.schemaService.getDatatypeOrDefault(
        col.dataType,
        true,
      );
      const ageSourceField = resolveAgeSourceField(col);
      fns[col.id] = (value, record) => {
        if (value === undefined && ageSourceField) {
          return record[ageSourceField]?.age;
        }
        return datatype?.sortValue(value);
      };
    }
    return fns;
  });

  /** Sorted rows derived from filtered records and effective sort. */
  readonly sortedRows = computed<TableRow<T>[]>(() => {
    if (!this.context) return [];
    const rows = this.context.filteredRecords().map((record) => ({ record }));
    const sort = this.effectiveSort();

    if (!sort?.active || !sort.direction) {
      return rows;
    }

    return tableSort<T, keyof T>(rows, {
      active: sort.active as keyof T,
      direction: sort.direction,
      sortValueFns: this.sortValueFns(),
    });
  });

  constructor() {
    // Sync default sort when no manual override and no URL state
    effect(() => {
      if (!this.context) return;
      if (
        !this.sortManuallySet() &&
        !this.tableStateUrl.getUrlParam("sortBy")
      ) {
        this.sortState.set(this.defaultSort());
      }
    });

    // Apply external sort input and persist to URL
    effect(() => {
      if (!this.context) return;
      const externalSort = this.context.externalSort();
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
  }

  /** Connects component signals to this store. Must be called once from component constructor. */
  connect(context: EntitiesTableSortContext<T>) {
    this.context = context;
  }

  /** Attaches `MatSort`, restores URL sort state, and keeps URL in sync with user sort changes. */
  attachSort(sort: MatSort | undefined) {
    if (!sort || this.attachedSort === sort) return;
    this.attachedSort = sort;

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
}

/**
 * Infers a stable default sort from visible sortable columns.
 * Date-like columns default to descending order.
 */
export function inferDefaultSort(
  colsToDisplay: string[],
  columns: FormFieldConfig[],
  getDatatypeOrDefault: (dataType?: string) => unknown,
): Sort | undefined {
  const sortBy = colsToDisplay
    .filter((columnId) => !columnId.startsWith("__"))
    .find((columnId) => {
      const column = columns.find((c) => c.id === columnId);
      return !column?.noSorting;
    });
  const sortByColumn = columns.find((c) => c.id === sortBy);

  let sortDirection: SortDirection = "asc";
  if (
    sortByColumn?.viewComponent === "DisplayDate" ||
    sortByColumn?.viewComponent === "DisplayMonth" ||
    getDatatypeOrDefault(sortByColumn?.dataType) instanceof DateDatatype
  ) {
    sortDirection = "desc";
  }

  return sortBy ? { active: sortBy, direction: sortDirection } : undefined;
}

/**
 * Resolve the source field for virtual `DisplayAge` columns.
 *
 * These columns display an age from another field, e.g. `age` reads
 * `record.dateOfBirth.age`, so datatype sorting cannot use the column value directly.
 * The legacy `age` and `age_<field>` conventions remain supported for existing configs.
 */
function resolveAgeSourceField(column: FormFieldConfig): string | undefined {
  if (
    column.viewComponent === "DisplayAge" &&
    typeof column.additional === "string"
  ) {
    return column.additional;
  }
  if (column.id === "age") {
    return "dateOfBirth";
  }
  if (column.id.startsWith("age_")) {
    return column.id.slice("age_".length);
  }
  return undefined;
}

/**
 * Applies sorting rules to columns: disables sorting for entity references,
 * untyped columns, and arrays (unless the datatype provides custom sort logic).
 */
export function applySortingRules(
  columns: FormFieldConfig[],
  getDatatypeOrDefault: (dataType?: string) => DefaultDatatype,
): FormFieldConfig[] {
  return columns.map((column) => {
    if (column.viewComponent === "DisplayAge") {
      return column;
    }

    if (column.isArray) {
      const datatype = getDatatypeOrDefault(column.dataType);
      if (datatype?.sortValue !== DefaultDatatype.prototype.sortValue) {
        return column;
      }
    }

    if (
      column.isArray ||
      column.dataType === EntityDatatype.dataType ||
      !column.dataType
    ) {
      return { ...column, noSorting: true };
    }

    return column;
  });
}
