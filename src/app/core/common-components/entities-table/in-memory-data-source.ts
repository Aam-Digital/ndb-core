import { CollectionViewer } from "@angular/cdk/collections";
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Signal,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort, Sort, SortDirection } from "@angular/material/sort";
import { BehaviorSubject, Observable } from "rxjs";
import { entityFilterPredicate } from "../../filter/filter-generator/filter-predicate";
import { FilterService } from "../../filter/filter.service";
import { DataFilter } from "../../filter/filters/filters";
import { EntityConstructor } from "../../entity/model/entity";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { applyUpdate } from "../../entity/model/entity-update";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { FormFieldConfig } from "../entity-form/FormConfig";
import { EntitiesTableDataSource } from "./entities-table-data-source";
import { TableRow } from "./table-row";
import { tableSort, SortValueFns } from "./table-sort/table-sort";
import { TableStateUrlService } from "./table-state-url.service";
import {
  applySortingRules,
  inferDefaultSort,
  resolveAgeSourceField,
} from "./entities-table-sort.store";

/**
 * In-memory data source for EntitiesTableComponent.
 *
 * Handles all data loading (via EntityMapperService), real-time update
 * subscriptions, filtering (domain filter + freetext + isActive toggle),
 * sorting (with URL-state persistence), and pagination.
 *
 * Must be created inside an Angular injection context (e.g. as a component
 * field initializer or via TestBed.runInInjectionContext in tests) because it
 * uses inject() to resolve its dependencies.
 *
 * Usage – auto-loading mode:
 *   readonly dataSource = new InMemoryDataSource(ChildEntity);
 *
 * Usage – external-records mode (caller owns loading):
 *   readonly dataSource = new InMemoryDataSource();
 *   effect(() => this.dataSource.allRecords.set(this.myRecords()));
 */
export class InMemoryDataSource<T extends Entity> extends EntitiesTableDataSource<T> {
  // --- Injected services ---
  private readonly entityMapper = inject(EntityMapperService);
  private readonly filterService = inject(FilterService);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly tableStateUrl = inject(TableStateUrlService);
  private readonly destroyRef = inject(DestroyRef);

  // --- Raw records (set by loader or external caller) ---
  /** All loaded records before any filtering. Undefined while loading. */
  readonly allRecords = signal<T[] | undefined>(undefined);

  // --- Configurable filter state (writable by entities-table inputs) ---
  readonly filter = signal<DataFilter<T>>({});
  readonly filterFreetext = signal<string>("");
  readonly showInactive = signal<boolean>(false);

  // --- Derived: filtering ---
  private readonly effectiveFilter = computed<DataFilter<T>>(() => {
    const next = { ...this.filter() };
    if (this.showInactive()) {
      delete next["isActive"];
    } else {
      (next as any)["isActive"] = true;
    }
    return next;
  });

  readonly filteredRecords = computed<T[]>(() => {
    const records = this.allRecords() ?? [];
    const predicate = this.filterService.getFilterPredicate(
      this.effectiveFilter(),
    );
    const domainFiltered = records.filter(predicate);
    const freetext = this.filterFreetext();
    if (!freetext) return domainFiltered;
    return domainFiltered.filter((r) => entityFilterPredicate(r, freetext));
  });

  // --- Loading state ---
  /** True while no records are available yet (auto-loading or waiting for external records). */
  readonly isLoading = computed<boolean>(() => this.allRecords() === undefined);

  // --- Sort state ---
  // "Aliased signal" pattern: connectColumns() stores a reference to the
  // caller-provided signals so that computed() signals react to them without
  // creating nested effects.
  private _columnsToDisplayRef = signal<Signal<string[]>>(signal([]));
  private _columnsRef = signal<Signal<FormFieldConfig[]>>(signal([]));
  private _externalSortRef = signal<Signal<Sort | undefined>>(signal(undefined));
  private _sortState = signal<Sort | undefined>(undefined);
  private _sortManuallySet = signal(false);
  private _attachedSort?: MatSort;

  /** Column definitions with sort-rule flags applied (noSorting where applicable). */
  readonly columns = computed<FormFieldConfig[]>(() =>
    applySortingRules(this._columnsRef()(), (dataType) =>
      this.schemaService.getDatatypeOrDefault(dataType, true),
    ),
  );

  private readonly _defaultSort = computed<Sort | undefined>(() =>
    inferDefaultSort(
      this._columnsToDisplayRef()(),
      this.columns(),
      (dataType) => this.schemaService.getDatatypeOrDefault(dataType),
    ),
  );

  readonly effectiveSort = computed<Sort | undefined>(
    () => this._sortState() ?? this._defaultSort(),
  );

  private readonly _sortValueFns = computed<SortValueFns<T>>(() => {
    const fns: SortValueFns<T> = {};
    for (const col of this._columnsRef()()) {
      const datatype = this.schemaService.getDatatypeOrDefault(
        col.dataType,
        true,
      );
      const ageSourceField = resolveAgeSourceField(col);
      fns[col.id] = (value, record) => {
        if (value === undefined && ageSourceField) {
          return (record as any)[ageSourceField]?.age;
        }
        return datatype?.sortValue(value);
      };
    }
    return fns;
  });

  readonly sortedRows = computed<TableRow<T>[]>(() => {
    const rows = this.filteredRecords().map((record) => ({ record }));
    const sort = this.effectiveSort();
    if (!sort?.active || !sort.direction) return rows;
    return tableSort<T, keyof T>(rows, {
      active: sort.active as keyof T,
      direction: sort.direction,
      sortValueFns: this._sortValueFns(),
    });
  });

  // --- Pagination ---
  private _paginator?: MatPaginator;

  // --- Observable bridge for mat-table ---
  private readonly _dataSubject = new BehaviorSubject<TableRow<T>[]>([]);

  // ---------------------------------------------------------

  constructor(entityType?: EntityConstructor<T>) {
    super();

    if (entityType) {
      this.connectEntityUpdates(() => entityType, true);
    }

    // Sync default sort when no manual override and no URL state
    effect(() => {
      if (
        !this._sortManuallySet() &&
        !this.tableStateUrl.getUrlParam("sortBy")
      ) {
        this._sortState.set(this._defaultSort());
      }
    });

    // Apply external sort override (from component's sortBy input)
    effect(() => {
      const ext = this._externalSortRef()();
      if (!ext) return;
      this._sortState.set(ext);
      if (ext.active) {
        this.tableStateUrl.updateUrlParams({
          sortBy: ext.active,
          sortOrder: ext.direction ?? "asc",
        });
      }
      this._sortManuallySet.set(true);
    });

    // Push sorted rows into the observable bridge
    effect(() => {
      const rows = this.sortedRows();
      if (this._paginator) {
        this._paginator.length = rows.length;
      }
      this._dataSubject.next(this._pageRows(rows));
    });
  }

  /**
   * Subscribe reactively to real-time entity updates for a given entity type.
   * Call once from the host component's constructor.
   * The subscription is replaced (and the previous one cancelled) whenever
   * `entityTypeSig` emits a new value.  Marks allRecords = undefined (loading)
   * each time the entity type changes.
   *
   * @param entityTypeSig Signal that emits the entity type to subscribe to.
   * @param autoLoad When true, also load all records from the database on each
   *   entity-type change (auto-loading mode). Defaults to false so that callers
   *   can supply records themselves via allRecords.
   */
  connectEntityUpdates(
    getEntityType: () => EntityConstructor<T> | undefined,
    autoLoad = false,
  ): void {
    effect((onCleanup) => {
      const ctr = getEntityType();
      if (!ctr) return;
      this.allRecords.set(undefined);
      if (autoLoad) {
        this.entityMapper
          .loadType(ctr)
          .then((records) => this.allRecords.set(records));
      }
      const sub = this.entityMapper
        .receiveUpdates(ctr)
        .subscribe((update) => {
          this.allRecords.set(applyUpdate(this.allRecords() ?? [], update));
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  // --- EntitiesTableDataSource interface ---

  attachSort(sort: MatSort): void {
    if (!sort || this._attachedSort === sort) return;
    this._attachedSort = sort;

    const urlSortBy = this.tableStateUrl.getUrlParam("sortBy");
    const urlSortOrder = this.tableStateUrl.getUrlParam(
      "sortOrder",
    ) as SortDirection;
    if (urlSortBy) {
      sort.active = urlSortBy;
      sort.direction = urlSortOrder || "asc";
      this._sortState.set({ active: sort.active, direction: sort.direction });
      this._sortManuallySet.set(true);
    }

    sort.sortChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this._sortState.set(value);
        this._sortManuallySet.set(true);
        this._updateSortUrlParams(value.active, value.direction);
      });
  }

  attachPaginator(paginator: MatPaginator): void {
    this._paginator = paginator;
    paginator.page
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this._dataSubject.next(this._pageRows(this.sortedRows()));
      });
    // Initial sync
    this._dataSubject.next(this._pageRows(this.sortedRows()));
  }

  connectColumns(
    columnsToDisplay: Signal<string[]>,
    columns: Signal<FormFieldConfig[]>,
    externalSort: Signal<Sort | undefined>,
  ): void {
    // Store signal references so computed() signals react to them without
    // creating new effects (which is forbidden inside reactive contexts).
    this._columnsToDisplayRef.set(columnsToDisplay);
    this._columnsRef.set(columns);
    this._externalSortRef.set(externalSort);
  }

  // --- CDK DataSource ---

  connect(_collectionViewer: CollectionViewer): Observable<TableRow<T>[]> {
    return this._dataSubject.asObservable();
  }

  disconnect(_collectionViewer: CollectionViewer): void {
    this._dataSubject.complete();
  }

  // --- Private helpers ---

  private _pageRows(rows: TableRow<T>[]): TableRow<T>[] {
    const p = this._paginator;
    if (!p) return rows;
    const start = p.pageIndex * p.pageSize;
    return rows.slice(start, start + p.pageSize);
  }

  private _updateSortUrlParams(active: string, direction: SortDirection) {
    if (!direction) {
      this.tableStateUrl.updateUrlParams({ sortBy: null, sortOrder: null });
      return;
    }
    if (direction === "desc") {
      this.tableStateUrl.updateUrlParams({ sortBy: active, sortOrder: "desc" });
      return;
    }
    this.tableStateUrl.updateUrlParams({ sortBy: active, sortOrder: null });
  }
}
