import { inject, Injectable } from "@angular/core";
import { Entity } from "../../core/entity/model/entity";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { DatabaseIndexingService } from "../../core/entity/database-indexing/database-indexing.service";
import { EntityPage } from "../../core/entity/entity-mapper/entity-mapper.service";
import { AuditRecord } from "./model/audit-record";
import { RawAuditDoc } from "./change-history-normalize";
import { DataFilter } from "../../core/filter/filters/filters";
import { Logging } from "../../core/logging/logging.service";
import {
  AUDIT_REFERENCE_VIEW,
  buildAuditReferenceIndex,
} from "./audit-reference-index";

/** one page of the reference view, as the backend proxies it */
interface ViewResponse {
  offset?: number;
  rows: { doc?: RawAuditDoc }[];
}

/**
 * Loads the audited changes involving one given record.
 *
 * This cannot be a Mango query: the referenced ids sit inside each record's
 * diff, and a JSON index stores an array-valued field as a single key, so
 * membership lookups never hit it. A map/reduce view answers it instead, and
 * pages differently - hence a loader of its own rather than the ordinary
 * entity query.
 */
@Injectable({ providedIn: "root" })
export class AuditReferenceLoaderService {
  private readonly indexing = inject(DatabaseIndexingService);
  private readonly schemaService = inject(EntitySchemaService);

  /** created once per session; writing it again is a no-op when unchanged */
  private indexCreated?: Promise<void>;

  /**
   * Create the view this loader queries, once per session.
   *
   * A failure must not stop the query: the view may well exist already, from
   * an earlier session or another admin - and writing a design document needs
   * a permission that reading one does not.
   */
  private ensureIndex(): Promise<void> {
    this.indexCreated ??= this.indexing
      .createIndex(buildAuditReferenceIndex(), AuditRecord.DATABASE)
      .catch((err) => {
        Logging.debug("could not ensure the audit reference view", err);
        this.indexCreated = undefined;
      });
    return this.indexCreated;
  }

  /**
   * The backend pages a permission-filtered view by absolute position rather
   * than by cursor: the first request carries the range start, and each further
   * one drops it and skips past everything already returned. It reports the
   * position it actually reached - the start plus however many denied rows it
   * had to skip over - so `offset + rows.length` is the next unseen row.
   */
  async loadPageFor(
    forEntity: Entity,
    filter: DataFilter<AuditRecord>,
    page: { limit: number; bookmark?: string },
  ): Promise<EntityPage<AuditRecord>> {
    await this.ensureIndex();

    const recordId = forEntity.getId();
    const skip = page.bookmark ? Number(page.bookmark) : 0;
    // the view is keyed [referencedId, timestamp], so the date range that the
    // rest of the filter bar expresses as a selector becomes part of the key
    const bounds = (filter as { timestamp?: { $gte?: string; $lte?: string } })
      ?.timestamp;
    const query: Record<string, unknown> = {
      // a one-element array sorts before every `[id, ...]`, so an unbounded
      // range ends before the oldest record of this id
      endkey: bounds?.$gte ? [recordId, bounds.$gte] : [recordId],
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
      // `{}` sorts after every string, so the range starts past the newest
      query.startkey = [recordId, bounds?.$lte ?? {}];
    }

    const response: ViewResponse = await this.indexing.queryIndexRaw(
      AUDIT_REFERENCE_VIEW,
      query,
      true,
      AuditRecord.DATABASE,
    );
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
