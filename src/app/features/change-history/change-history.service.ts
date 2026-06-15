import { inject, Injectable } from "@angular/core";
import { DatabaseFactoryService } from "../../core/database/database-factory.service";
import { Database } from "../../core/database/database";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { Entity } from "../../core/entity/model/entity";
import { ChangeEvent } from "./change-history.types";
import { buildChangeEvents, RawAuditDoc } from "./change-history-normalize";

/** CASL subject the audit records are keyed under (see replication-backend #4026). */
export const AUDIT_RECORD_SUBJECT = "AuditRecord";

/**
 * Reads an entity's change history from the audit database recorded by the
 * replication-backend (issue #4026).
 *
 * The audit database `<db>-audit` is opened as a read-only remote database and
 * queried on demand per entity (it grows unboundedly, so it is never synced
 * locally). Records are keyed `AuditRecord:<entityId>:<ts>:<rev>`, so a single
 * `_id` prefix range query returns one entity's full history with no extra
 * index.
 */
@Injectable({ providedIn: "root" })
export class ChangeHistoryService {
  private readonly dbFactory = inject(DatabaseFactoryService);
  private readonly ability = inject(EntityAbility, { optional: true });

  /** the derived audit db name, e.g. `app-audit` */
  static auditDbName(): string {
    return `${Entity.DATABASE}-audit`;
  }

  private auditDb?: Database;

  private getAuditDb(): Database {
    if (!this.auditDb) {
      this.auditDb = this.dbFactory.createRemoteDatabase(
        ChangeHistoryService.auditDbName(),
      );
    }
    return this.auditDb;
  }

  /**
   * Fetch the normalized, newest-first change history for one entity.
   * Rejects if the audit database is unavailable (caller renders the
   * not-enabled state).
   */
  async getHistory(entity: Entity): Promise<ChangeEvent[]> {
    const prefix = `AuditRecord:${entity.getId()}:`;
    const docs = await this.getAuditDb().getAll(prefix);
    return buildChangeEvents(docs as RawAuditDoc[]);
  }

  /**
   * Whether the current user may view the change history of this entity.
   * Hidden for new/internal entities and gated on read access to the
   * `AuditRecord` subject. Fails closed: if the permission engine is not
   * available, access to this (permission-gated) audit data is denied. Shared
   * by both entry points (the entity-actions menu and the last-edited widget)
   * so they cannot drift.
   */
  canViewHistory(entity?: Entity): boolean {
    if (!entity || entity.isNew || entity.getConstructor().isInternalEntity) {
      return false;
    }
    return !!this.ability && this.ability.can("read", AUDIT_RECORD_SUBJECT);
  }
}
