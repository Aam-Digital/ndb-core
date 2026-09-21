import { IconName } from "@fortawesome/fontawesome-svg-core";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { ChangeAction, OPERATION_TO_ACTION } from "../change-history.types";
import { changedFieldsOf } from "../change-history-normalize";

/**
 * How many `:`-separated parts trail the changed record's id in an audit
 * record's id, which the backend builds as
 * `AuditRecord:<record id>:<ISO timestamp>:<rev>`.
 *
 * Four, not two: an ISO timestamp carries two colons of its own
 * (`2026-08-01T10:00:00.000Z`), so it accounts for three of them, plus one for
 * the revision.
 */
const AUDIT_ID_TRAILING_PARTS = 4;

/** the author of a change, as the backend records it */
export interface AuditUser {
  id?: string;
  name?: string;
  roles?: string[];
}

/**
 * One audited write, as recorded by the replication-backend in the derived
 * `<db>-audit` database.
 *
 * Deliberately declares no field for the document's `entityId`: that name
 * collides with Entity's own private `entityId` accessor, so a schema field of
 * that name would not create an own property and would corrupt the record's
 * `_id`. The changed record is derived from this document's own id instead
 * (see {@link record}), which needs no field and no data migration.
 */
@DatabaseEntity("AuditRecord")
export class AuditRecord extends Entity {
  /** written by the backend into a database of its own, never replicated here */
  static override readonly DATABASE = `${Entity.DATABASE}-audit`;
  static override readonly DATABASE_REMOTE_ONLY = true;

  static override readonly isInternalEntity = true;
  static override readonly toStringAttributes = ["record"];
  static override readonly label = $localize`:AuditRecord label:Change`;
  static override readonly labelPlural = $localize`:AuditRecord label plural:Changes`;
  static override readonly icon: IconName = "clock-rotate-left";

  /** server-set time of the change */
  @DatabaseField() timestamp: Date;

  /** the kind of write, as the backend names it */
  @DatabaseField() operation: "create" | "update" | "delete" | "baseline";

  /** server-set from the authenticated user */
  @DatabaseField() user: AuditUser;

  /** `_rev` of the written revision, not of this audit document */
  @DatabaseField() rev: string;

  /** the written revision's parent */
  @DatabaseField() parentRev: string;

  /** source database name, e.g. `app` */
  @DatabaseField() database: string;

  /**
   * What changed, in a shape that depends on {@link operation}:
   *
   * - `create`: a jsondiffpatch whole-value add, i.e. `[<the new document>]`
   * - `update`: a jsondiffpatch delta keyed by field name, each value
   *   `[<before>, <after>]`
   * - `delete`: a structural delta of the tombstone. A deletion replicates
   *   stripped of its content, so this names no displayable fields
   * - `baseline`: the full document as it stood when logging was switched on,
   *   not a delta - there is nothing prior to diff against
   *
   * Untyped on purpose: the keys are field names of whichever entity type was
   * changed, so no schema of this type can describe them.
   */
  @DatabaseField() diff?: any;

  /** the changed record's id, e.g. `Child:123` */
  get record(): string {
    // everything before the trailing timestamp and revision. The record's own
    // id contains a colon too, so this counts from the end rather than the start
    const parts = this.getId(true).split(":");
    return parts.slice(0, -AUDIT_ID_TRAILING_PARTS).join(":");
  }

  /** the changed record's type, e.g. `Child` */
  get recordType(): string {
    return Entity.extractTypeFromId(this.record);
  }

  /** the displayed action, which unlike {@link operation} is past tense */
  get action(): ChangeAction {
    return OPERATION_TO_ACTION[this.operation];
  }

  /**
   * The names of the fields this write changed.
   *
   * Readable from this record alone, unlike the before/after values, because a
   * delta is already keyed by field name. Empty for a delete, which replicates
   * as a tombstone stripped of its content.
   */
  get changedFields(): string[] {
    return changedFieldsOf(this);
  }

  /** the recorded author, which is a user-entity id when one was recorded */
  get author(): string {
    return this.user?.name ?? this.user?.id ?? "";
  }
}
