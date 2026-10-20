import { Entity } from "#src/app/core/entity/model/entity";
import { MatSort } from "@angular/material/sort";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { MatPaginator } from "@angular/material/paginator";
import { effect, inject, signal } from "@angular/core";
import { EntityFilter } from "#src/app/core/filter/filters/entityFilter";
import { EntitiesTableDataSource } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { merge } from "rxjs";
import {
  EntitySpecialLoaderService,
  supportsPagination,
} from "#src/app/core/entity/entity-special-loader/entity-special-loader.service";
import {
  EntityPage,
  FULL_LOAD_PAGE_SIZE,
} from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { EntitySchema } from "#src/app/core/entity/schema/entity-schema";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { getEmbeddedSchema } from "#src/app/core/entity/schema/embedded-schema-field.util";

/** datatypes whose value is stored as the referenced id alone */
const STORED_BY_ID_DATATYPES = ["configurable-enum", "entity"];

export class PaginatedDataSource<
  T extends Entity,
> extends EntitiesTableDataSource<T> {
  private readonly specialLoader = inject(EntitySpecialLoaderService);
  private readonly schemaService = inject(EntitySchemaService);

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
  protected resetPaginationCache() {
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
      const generation = this.loadGeneration;
      const res = await this.fetchPage(
        this.effectiveFilter,
        { limit: deficit, bookmark: this.bookmark },
        this.sortState,
      );
      if (generation !== this.loadGeneration) {
        // filter/sort/entity-update invalidated this request while it was in
        // flight - a new load for the current state is already under way.
        return [];
      }
      // update signal to trigger effect for data update in super-class
      this.filteredRecords.update((records) => [...records, ...res.records]);
      this.bookmark = res.bookmark;
      this.reachedEnd = res.records.length < deficit;
    }

    const totalLoaded = this.filteredRecords().length;
    this.hasUnknownTotalCount.set(totalLoaded > start + this.page.size);
    // `this.allRecords` stays empty;
  }

  /**
   * Fetch one page, continuing from `page.bookmark` when one is given.
   *
   * The seam for data that is paged some other way than by a Mango query: the
   * bookmark is opaque to this class, so an override is free to put its own
   * cursor in it as long as a short page still means the end of the data.
   */
  protected async fetchPage(
    filter: DataFilter<T>,
    page: { limit: number; bookmark?: string },
    sort: { prop?: string; dir?: "asc" | "desc" },
  ): Promise<EntityPage<T>> {
    const config = this.loadRecordConfig();
    if (supportsPagination(config.loaderMethod)) {
      // a loader that serves pages of its own: the pagination state stays here,
      // only the fetching moves
      return this.specialLoader.loadPageFor<T>(
        config.loaderMethod,
        config.forEntity,
        filter,
        page,
      );
    }
    return this.entityMapper.findType(config.entityCtr, filter, page, sort);
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
    return this.toDbSelector(filter, {
      schema: this.loadRecordConfig()?.entityCtr?.schema,
    });
  }

  /**
   * Rewrite a query on the entity format into one on the database format.
   * The schema is walked alongside the query, so that fields nested inside
   * embedded fields (in `$elemMatch` or as dotted paths) are resolved as well.
   */
  private toDbSelector(query: unknown, ctx: SchemaContext): any {
    if (Array.isArray(query)) {
      return query.map((q) => this.toDbSelector(q, ctx));
    }
    if (!query || typeof query !== "object") {
      return query;
    }

    const result = {};
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith("$")) {
        result[key] = this.toDbSelector(value, ctx);
        continue;
      }
      const { dbPath, field } = this.toDbPath(key, ctx);
      const condition = this.toDbCondition(value, field);
      // pouchdb-find skips implicit equality with a falsy value (e.g. `{status: ""}`)
      // inside `$elemMatch` and matches every entry, an explicit `$eq` works on both engines
      result[dbPath] =
        ctx.inElemMatch && !isOperatorObject(condition)
          ? { $eq: condition }
          : condition;
    }
    return result;
  }

  /**
   * Translate a (dotted) field path into its path in the database format:
   * enum and entity references are stored as the plain id, so e.g.
   * "gender.id" becomes "gender" and "phoneNumber.type.id" becomes "phoneNumber.type".
   * Only for fields that are actually stored that way, though - on any other
   * field ".id" is a real path into an object value.
   */
  private toDbPath(
    key: string,
    ctx: SchemaContext,
  ): { dbPath: string; field?: EntitySchemaField } {
    const dbSegments: string[] = [];
    let current = ctx;
    let field: EntitySchemaField | undefined;
    for (const segment of key.split(".")) {
      if (
        segment === "id" &&
        STORED_BY_ID_DATATYPES.includes(field?.dataType)
      ) {
        continue;
      }
      dbSegments.push(
        current.isLegacyAttendanceEntry
          ? toLegacyAttendanceEntryPath(segment)
          : segment,
      );
      field = current.schema?.get(segment);
      current = this.getEmbeddedContext(field);
    }
    return { dbPath: dbSegments.join("."), field };
  }

  private toDbCondition(
    condition: unknown,
    field: EntitySchemaField | undefined,
  ): unknown {
    if (condition === undefined) {
      // `undefined` cannot be sent in a Mango query, and dropping the key
      // would leave an empty selector that matches every document
      return { $exists: false };
    }
    if (!isOperatorObject(condition)) {
      return condition;
    }

    const result = {};
    for (const [operator, value] of Object.entries(condition)) {
      if (operator === "$elemMatch") {
        result[operator] = this.toDbSelector(value, {
          ...this.getEmbeddedContext(field),
          inElemMatch: true,
        });
      } else if (operator === "$not") {
        result[operator] = this.toDbCondition(value, field);
      } else {
        result[operator] = value;
      }
    }
    return result;
  }

  private getEmbeddedContext(
    field: EntitySchemaField | undefined,
  ): SchemaContext {
    return {
      schema: getEmbeddedSchema(this.schemaService, field),
      isLegacyAttendanceEntry: field?.dataType === LEGACY_ATTENDANCE_DATATYPE,
    };
  }
}

/** The schema that the keys of a (nested) query object refer to. */
interface SchemaContext {
  schema?: EntitySchema;
  /**
   * Whether the keys refer to an entry of the deprecated "event-attendance-map" datatype,
   * which is stored as a tuple `[participantId, {status, remarks}]` instead of an object.
   */
  isLegacyAttendanceEntry?: boolean;
  /** Whether the keys are the conditions on an array entry inside `$elemMatch`. */
  inElemMatch?: boolean;
}

function isOperatorObject(condition: unknown): condition is object {
  return (
    !!condition && typeof condition === "object" && !Array.isArray(condition)
  );
}

/**
 * The deprecated `EventAttendanceMapDatatype`, which stores its entries as a tuple.
 *
 * @deprecated remove together with EventAttendanceMapDatatype
 */
const LEGACY_ATTENDANCE_DATATYPE = "event-attendance-map";

/**
 * Path of an `AttendanceItem` property within the tuple
 * `[participantId, {status, remarks}]` stored by the deprecated `EventAttendanceMapDatatype`.
 *
 * @deprecated remove together with EventAttendanceMapDatatype
 */
function toLegacyAttendanceEntryPath(innerProp: string): string {
  return innerProp === "participant" ? "0" : `1.${innerProp}`;
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
