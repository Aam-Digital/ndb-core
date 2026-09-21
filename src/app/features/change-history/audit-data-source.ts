import { inject, signal } from "@angular/core";
import { PaginatedDataSource } from "../../core/common-components/entities-table/data-source/paginated-data-source";
import { DataFilter } from "../../core/filter/filters/filters";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { AuditRecord } from "./model/audit-record";
import { ChangeHistoryService } from "./change-history.service";
import { RawAuditDoc } from "./change-history-normalize";
import { endOfDay } from "./audit-filter";

/** the filters the reference view can answer, all of them part of its key */
export interface RelatedRecordQuery {
  /** the record whose involvement is asked about, e.g. `User:1` */
  recordId: string;
  from?: Date;
  to?: Date;
}

/** one page of the reference view, as the backend proxies it */
interface ViewResponse {
  offset?: number;
  rows: { doc?: RawAuditDoc }[];
}

/**
 * The change log's records, loaded one of two ways depending on the filters:
 * every audited change, or only the changes involving one given record.
 *
 * "Which changes involved this record?" cannot be a Mango query: the referenced
 * ids sit inside each record's diff, and a JSON index stores an array-valued
 * field as a single key, so membership lookups never hit it. It is answered by
 * a map/reduce view instead - a different query with a different cursor, which
 * the table never has to know about.
 */
export class AuditDataSource extends PaginatedDataSource<AuditRecord> {
  private readonly service = inject(ChangeHistoryService);
  private readonly schemaService = inject(EntitySchemaService);

  /** when set, the log answers "what involved this record?" instead */
  readonly relatedRecord = signal<RelatedRecordQuery | undefined>(undefined);

  /**
   * Switch between listing every change and listing only those involving one
   * record. Everything paged through so far belongs to the previous mode, so
   * it is discarded.
   */
  setRelatedRecord(related: RelatedRecordQuery | undefined) {
    this.relatedRecord.set(related);
    this.resetPaginationCache();
  }

  protected override async fetchPage(
    filter: DataFilter<AuditRecord>,
    page: { limit: number; bookmark?: string },
    sort: { prop?: string; dir?: "asc" | "desc" },
  ): Promise<{ records: AuditRecord[]; bookmark?: string }> {
    const related = this.relatedRecord();
    if (!related) {
      return super.fetchPage(filter, page, sort);
    }
    return this.fetchReferencePage(related, page);
  }

  /**
   * One page of the reference view.
   *
   * The backend pages a permission-filtered view by absolute position rather
   * than by cursor: the first request carries the range start, and each further
   * one drops it and skips past everything already returned. It reports the
   * position it actually reached - the start plus however many denied rows it
   * had to skip over - so `offset + rows.length` is the next unseen row.
   */
  private async fetchReferencePage(
    related: RelatedRecordQuery,
    page: { limit: number; bookmark?: string },
  ): Promise<{ records: AuditRecord[]; bookmark?: string }> {
    const skip = page.bookmark ? Number(page.bookmark) : 0;
    const query: Record<string, unknown> = {
      // a one-element array sorts before every `[id, ...]`, so an unbounded
      // range ends before the oldest record of this id
      endkey: related.from
        ? [related.recordId, related.from.toISOString()]
        : [related.recordId],
      descending: true,
      // the rows are rendered from the documents. It also decides how the
      // backend answers: it permission-filters and pages a view response only
      // when the documents are included
      include_docs: true,
      limit: page.limit,
    };
    if (skip > 0) {
      query.skip = skip;
    } else {
      // `{}` sorts after every string, so an unbounded range starts past the
      // newest timestamp
      query.startkey = [
        related.recordId,
        related.to ? endOfDay(related.to) : {},
      ];
    }

    const response: ViewResponse = await this.service.queryReferenceView(query);
    const rows = response.rows ?? [];
    const records = rows
      .map((row) => row.doc)
      .filter((doc): doc is RawAuditDoc => !!doc)
      .map((doc) =>
        this.schemaService.loadDataIntoEntity(new AuditRecord(), { ...doc }),
      );

    return {
      records,
      bookmark: String((response.offset ?? skip) + rows.length),
    };
  }
}
