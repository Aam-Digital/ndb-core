import { Entity } from "#src/app/core/entity/model/entity";
import { MatSort } from "@angular/material/sort";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { MatPaginator } from "@angular/material/paginator";
import { effect, signal } from "@angular/core";
import { EntityFilter } from "#src/app/core/filter/filters/entityFilter";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { merge } from "rxjs";

/**
 * Number of documents fetched per request when loading the complete dataset
 * (see {@link PaginatedDataSource.getAllData}).
 */
export const FULL_LOAD_PAGE_SIZE = 500;

export class PaginatedDataSource<
  T extends Entity,
> extends EntitiesTableDataSource<T> {
  private sortRef: MatSort;
  private sortState: { prop?: string; dir?: "asc" | "desc" } = {};
  override set sort(sort: MatSort) {
    this.sortRef = sort;
    this.updateSort(this.sortRef.active, this.sortRef.direction);
    this.sortRef.sortChange.subscribe(({ active, direction }) => {
      this.updateSort(active, direction);
    });
  }
  override get sort(): MatSort {
    return this.sortRef;
  }

  private updateSort(active: string, direction: "asc" | "desc" | "") {
    if (
      (direction === "" && this.sortState.dir === undefined) ||
      (this.sortState.prop === active && this.sortState.dir === direction)
    ) {
      return;
    }
    if (direction === "") {
      this.sortState = {};
    } else {
      this.sortState = { prop: active, dir: direction };
    }
    this.resetPaginationCache();
  }

  private page: { size?: number; index?: number } = {};
  override set paginator(paginator: MatPaginator) {
    super.paginator = paginator;
    merge(paginator.initialized, paginator.page).subscribe(() => {
      this.page.size = paginator.pageSize;
      this.page.index = paginator.pageIndex;
      this.setRecords();
    });
  }
  override get paginator(): MatPaginator {
    return super.paginator;
  }

  /**
   * Whether the reported total is only a lower bound because there are more
   * records than have been loaded/counted so far. In this case the paginator
   * should indicate the total is unknown (e.g. "1 - 10 of 10+").
   */
  readonly hasUnknownTotalCount = signal(false);

  private effectiveFilter: DataFilter<T> = {};

  /** The DB cursor to continue fetching right after the records already in {@link filteredRecords}. */
  private bookmark: string | undefined;

  /** Whether the last fetch returned fewer records than requested, i.e. all matching records are already loaded. */
  private reachedEnd = false;

  constructor() {
    super();
    effect(() => {
      this.effectiveFilter = this.processFilterForDB(this.dataFilter());
      if (this.loadRecordConfig()) {
        this.resetPaginationCache();
      }
    });
  }

  /**
   * Discard all loaded records/cursor state and move back to the first page.
   * Necessary whenever the query itself changes (filter, sort, page size) or
   * the underlying data may have changed (entity update) - in all these
   * cases the existing bookmark chain is no longer valid.
   */
  private resetPaginationCache() {
    this.filteredRecords.set([]);
    this.bookmark = undefined;
    this.reachedEnd = false;
    if (super.paginator) {
      // setting page index manually to not trigger the change event which would result in duplicate fetch
      super.paginator.pageIndex = 0;
      this.page.index = 0;
      this.setRecords();
    }
  }

  protected override async loadRecords() {
    if (!this.loadRecordConfig() || !super.paginator) {
      return [];
    }

    const start = this.page.size * this.page.index;
    // +1: a probe beyond the current page, to detect whether further pages exist
    const requiredLength = start + this.page.size + 1;
    const loadedLength = this.filteredRecords().length;

    if (loadedLength < requiredLength && !this.reachedEnd) {
      const deficit = requiredLength - loadedLength;
      const res = await this.entityMapper.findType(
        this.loadRecordConfig().entityCtr,
        this.effectiveFilter,
        { limit: deficit, bookmark: this.bookmark },
        this.sortState,
      );
      // update signal to trigger effect for data update in super-class
      this.filteredRecords.update((records) => [...records, ...res.records]);
      this.bookmark = res.bookmark;
      this.reachedEnd = res.records.length < deficit;
    }

    const totalLoaded = this.filteredRecords().length;
    this.hasUnknownTotalCount.set(totalLoaded > start + this.page.size);
    // `this.allRecords` stays empty;
  }

  override async getAllData(filtered = false): Promise<T[]> {
    if (!this.loadRecordConfig()) return [];

    const entityCtr = this.loadRecordConfig().entityCtr;
    const filter = filtered ? this.effectiveFilter : {};

    // CouchDB's _find returns only 25 documents when no limit is given, so we
    // page through the results explicitly until a page is not completely filled.
    const allRecords: T[] = [];
    let exportBookmark: string | undefined;
    let page: T[];
    do {
      const res = await this.entityMapper.findType(
        entityCtr,
        filter,
        { limit: FULL_LOAD_PAGE_SIZE, bookmark: exportBookmark },
        this.sortState,
      );
      page = res.records;
      exportBookmark = res.bookmark;
      allRecords.push(...page);
    } while (page.length === FULL_LOAD_PAGE_SIZE);

    return allRecords;
  }

  protected override async processEntityUpdate() {
    // We don't really know how it might affect the pages -> full reload
    this.resetPaginationCache();
  }

  private processFilterForDB(filter: DataFilter<T>): EntityFilter<T> {
    // Mango queries need `$options: "i"` while CouchDB only supports `$regex: "(?i)..."`
    filter = convertToCouchRegex(filter);
    const filterString = JSON.stringify(filter);
    // replace e.g. "gender.id" with "gender" as configurable enums are only stored with id value
    const updatedString = filterString.replace(/("\w+)\.id(?=":)/g, "$1");
    return JSON.parse(updatedString);
  }
}

/**
 * Recursively converts any $regex value in an object to a CouchDB inline (?i) pattern.
 *
 * @param {*} node - The query object or value to transform.
 * @returns {*} The transformed query object.
 */
function convertToCouchRegex(node: any): any {
  if (node === null || typeof node !== "object") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(convertToCouchRegex);
  }

  const result = {};

  for (const [key, value] of Object.entries(node)) {
    // Strip $options completely
    if (key === "$options") {
      continue;
    }

    // Convert $regex patterns to inline case-insensitive format
    if (key === "$regex" && typeof value === "string") {
      result["$regex"] = `(?i)${value}`;
    } else {
      result[key] = convertToCouchRegex(value);
    }
  }

  return result;
}
