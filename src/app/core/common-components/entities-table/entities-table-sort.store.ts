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
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { FormFieldConfig } from "../entity-form/FormConfig";
import { TableStateUrlService } from "./table-state-url.service";

type ReadSignal<T> = () => T;

/**
 * Input signals consumed by `EntitiesTableSortStore`.
 */
export interface EntitiesTableSortContext {
  /** Visible column IDs (updated reactively). */
  columnsToDisplay: ReadSignal<string[]>;
  /** Full column definitions (updated reactively). */
  columns: ReadSignal<FormFieldConfig[]>;
  /** External sort override from a component input binding. */
  externalSort: ReadSignal<Sort | undefined>;
}

/**
 * Component-scoped store that manages table sort state, MatSort binding,
 * and URL query-param persistence.
 */
@Injectable()
export class EntitiesTableSortStore {
  private readonly tableStateUrl = inject(TableStateUrlService);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly destroyRef = inject(DestroyRef);

  private context: EntitiesTableSortContext | null = null;
  private readonly sortManuallySet = signal(false);
  private attachedSort?: MatSort;

  /** Explicitly set sort (via user interaction, URL state, or external input). */
  readonly sortState = signal<Sort>(undefined);

  /**
   * Default sort inferred from visible sortable columns.
   * Recomputed whenever columns or columnsToDisplay change.
   */
  readonly defaultSort = computed<Sort | undefined>(() => {
    if (!this.context) return undefined;
    return inferDefaultSort(
      this.context.columnsToDisplay(),
      this.context.columns(),
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
  connect(context: EntitiesTableSortContext) {
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
