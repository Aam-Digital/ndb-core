import { Entity } from "#src/app/core/entity/model/entity";
import { MatSort } from "@angular/material/sort";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { MatPaginator } from "@angular/material/paginator";
import { effect, signal } from "@angular/core";
import { EntityFilter } from "#src/app/core/filter/filters/entityFilter";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { TableRow } from "#src/app/core/common-components/entities-table/table-row";

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
    this.setRecords();
  }

  private page: { size?: number; index?: number } = {};
  private paginatorRef: MatPaginator;
  override set paginator(paginator: MatPaginator) {
    this.paginatorRef = paginator;
    this.paginatorRef.initialized.subscribe(() => {
      this.page.size = this.paginatorRef.pageSize;
      this.page.index = this.paginatorRef.pageIndex;
      this.resetPaginationCache();
      this.setRecords();
    });
    this.paginatorRef.page.subscribe((val) => {
      // a different page size invalidates the bookmark chain: pages fetched
      // under the old size no longer align with the new page boundaries
      if (val.pageSize !== this.page.size) {
        this.resetPaginationCache();
      }
      this.page.size = val.pageSize;
      this.page.index = val.pageIndex;
      this.setRecords();
    });
  }
  override get paginator(): MatPaginator {
    return this.paginatorRef;
  }

  /**
   * Total number of records reported to the paginator
   * (loaded pages plus at least one more record, if it exists).
   */
  private totalCount = 0;

  /**
   * Whether the reported total is only a lower bound because there are more
   * records than have been loaded/counted so far. In this case the paginator
   * should indicate the total is unknown (e.g. "1 - 10 of 10+").
   */
  readonly hasUnknownTotalCount = signal(false);

  private effectiveFilter: DataFilter<T> = {};

  /**
   * Already displayed pages, keyed by page index.
   *
   * CouchDB's Mango `bookmark` pagination (see {@link EntityMapperService.findType})
   * is forward-only - unlike `skip`, a bookmark can't be used to jump back to
   * an earlier page - so previously seen pages are kept here instead of being
   * requested again when the user pages backward.
   */
  private pageCache = new Map<number, { records: T[]; hasMore: boolean }>();

  /**
   * The DB cursor needed to fetch a page for the first time, keyed by that
   * page's index: the `bookmark` returned by the previous page's query, and -
   * if that query had to look one record ahead to detect `hasMore` - the
   * extra record it already fetched, which becomes this page's first record.
   */
  private fetchCursors = new Map<number, { bookmark?: string; leftover?: T }>();

  private resetPaginationCache() {
    this.pageCache.clear();
    this.fetchCursors.clear();
  }

  constructor() {
    super();
    effect(() => {
      this.effectiveFilter = this.processFilterForDB(this.dataFilter());
      if (this.loadRecordConfig()) {
        this.resetPaginationCache();
        this.setRecords();
      }
    });
  }

  protected override async loadRecords() {
    if (!this.loadRecordConfig()) return [];

    if (!Number.isInteger(this.page.size)) {
      // the paginator has not been bound yet (e.g. still initializing) -
      // load without pagination rather than fetching an arbitrary page size
      const res = await this.entityMapper.findType(
        this.loadRecordConfig().entityCtr,
        this.effectiveFilter,
        undefined,
        this.sortState,
      );
      this.hasUnknownTotalCount.set(false);
      this.totalCount = res.records.length;
      this.filteredRecords.set(res.records);
      return;
    }

    const targetIndex = this.page.index;
    // a bookmark can only be used to move forward, so any not-yet-cached page
    // (including the current one) must be reached by walking forward from the
    // last cached page, rebuilding the cursor chain as we go
    for (let i = 0; i <= targetIndex; i++) {
      if (!this.pageCache.has(i)) {
        await this.fetchAndCachePage(i);
      }
    }

    const { records, hasMore } = this.pageCache.get(targetIndex);
    this.hasUnknownTotalCount.set(hasMore);
    this.totalCount = this.page.size * targetIndex + records.length;
    // `this.allRecords` stays empty
    this.filteredRecords.set(records);
  }

  /**
   * Fetch a single not-yet-cached page and store it, along with the cursor
   * needed to fetch the following page.
   *
   * Requests one extra record beyond the page size as a probe for
   * {@link hasUnknownTotalCount}. That extra record is not requested again for
   * the next page - the returned bookmark already points past it - it is
   * instead carried forward as `leftover` and prepended there.
   */
  private async fetchAndCachePage(index: number) {
    const cursor = this.fetchCursors.get(index) ?? {};
    const needed = this.page.size - (cursor.leftover ? 1 : 0);

    const res = await this.entityMapper.findType(
      this.loadRecordConfig().entityCtr,
      this.effectiveFilter,
      { limit: needed + 1, bookmark: cursor.bookmark },
      this.sortState,
    );

    const fromServer = res.records.slice(0, needed);
    const records = cursor.leftover
      ? [cursor.leftover, ...fromServer]
      : fromServer;
    const hasMore = res.records.length > needed;

    this.pageCache.set(index, { records, hasMore });
    this.fetchCursors.set(index + 1, {
      bookmark: res.bookmark,
      leftover: hasMore ? res.records[needed] : undefined,
    });
  }

  override async getAllData(filtered = false): Promise<T[]> {
    if (!this.loadRecordConfig()) return [];

    const entityCtr = this.loadRecordConfig().entityCtr;
    const filter = filtered ? this.effectiveFilter : {};

    // CouchDB's _find returns only 25 documents when no limit is given, so we
    // page through the results explicitly until a page is not completely filled.
    const allRecords: T[] = [];
    let bookmark: string | undefined;
    let page: T[];
    do {
      const res = await this.entityMapper.findType(
        entityCtr,
        filter,
        { limit: FULL_LOAD_PAGE_SIZE, bookmark },
        this.sortState,
      );
      page = res.records;
      bookmark = res.bookmark;
      allRecords.push(...page);
    } while (page.length === FULL_LOAD_PAGE_SIZE);

    return allRecords;
  }

  /**
   * Records are already paginated by the database query,
   * so the MatTableDataSource base class must not slice them again by page index.
   */
  override _pageData(data: TableRow<T>[]): TableRow<T>[] {
    return data;
  }

  /**
   * The MatTableDataSource base class updates the paginator with the length of the
   * loaded data (deferred, after every data change) - which here is only a single page.
   * Report the overall total from the database query instead,
   * otherwise the base class would overwrite paginator.length right after setRecords().
   */
  override _updatePaginator(_filteredDataLength: number): void {
    super._updatePaginator(this.totalCount);
  }

  protected override async processEntityUpdate() {
    // We don't really know how it might affect the pages -> full reload
    this.resetPaginationCache();
    await this.setRecords();
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
