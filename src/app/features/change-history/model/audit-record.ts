import { IconName } from "@fortawesome/fontawesome-svg-core";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { ChangeAction, OPERATION_TO_ACTION } from "../change-history.types";

/**
 * The `:<ISO timestamp>:<rev>` that the backend appends when it builds an audit
 * record's id.
 *
 * Matched as an anchored whole rather than by splitting on ":", so that the
 * changed record's own id may contain colons - which it does for every record,
 * since it is itself type-prefixed.
 */
const AUDIT_ID_SUFFIX =
  /:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z:[^:]*$/;

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

  static override isInternalEntity = true;
  static override toStringAttributes = ["record"];
  static override label = $localize`:AuditRecord label:Change`;
  static override labelPlural = $localize`:AuditRecord label plural:Changes`;
  static override icon: IconName = "clock-rotate-left";

  /** server-set time of the change */
  @DatabaseField() timestamp: Date;

  /** the kind of write, as the backend names it */
  @DatabaseField() operation: "create" | "update" | "delete" | "baseline";

  /** server-set from the authenticated user */
  @DatabaseField() user: { id?: string; name?: string; roles?: string[] };

  /** `_rev` of the written revision, not of this audit document */
  @DatabaseField() rev: string;

  /** the written revision's parent */
  @DatabaseField() parentRev: string;

  /** source database name, e.g. `app` */
  @DatabaseField() database: string;

  /**
   * For create/update/delete a jsondiffpatch delta, for baseline the full
   * previous document. Passed through untyped: its keys are field names of
   * whichever entity type was changed, so no schema of this type can describe
   * them.
   */
  @DatabaseField() diff?: any;

  /** the changed record's id, e.g. `Child:123` */
  get record(): string {
    return this.getId(true).replace(AUDIT_ID_SUFFIX, "");
  }

  /** the changed record's type, e.g. `Child` */
  get recordType(): string {
    return Entity.extractTypeFromId(this.record);
  }

  /** the displayed action, which unlike {@link operation} is past tense */
  get action(): ChangeAction {
    return OPERATION_TO_ACTION[this.operation];
  }
}
