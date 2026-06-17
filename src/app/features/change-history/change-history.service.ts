import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Logging } from "../../core/logging/logging.service";
import { environment } from "../../../environments/environment";
import { DatabaseFactoryService } from "../../core/database/database-factory.service";
import { Database } from "../../core/database/database";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { Entity } from "../../core/entity/model/entity";
import { ChangeEvent } from "./change-history.types";
import { buildChangeEvents, RawAuditDoc } from "./change-history-normalize";

/** CASL subject the audit records are keyed under (see replication-backend #4026). */
export const AUDIT_RECORD_SUBJECT = "AuditRecord";

/** Feature flags from the backend `/actuator/features` endpoint. */
interface FeatureFlag {
  enabled: boolean;
}
type FeatureFlags = Record<string, FeatureFlag> & { audit?: FeatureFlag };

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
  private readonly httpClient = inject(HttpClient);

  /** the derived audit db name, e.g. `app-audit` */
  static auditDbName(): string {
    return `${Entity.DATABASE}-audit`;
  }

  /**
   * Lazy trigger for the feature-flag fetch. Kept off until
   * {@link loadAuditFeatureFlag} is called (when the change-history dialog
   * opens), so this root service — constructed eagerly via the app module —
   * does not fire an HTTP request at startup (which would otherwise leave unit
   * tests' zone perpetually unstable).
   */
  private readonly auditFlagRequested = signal(false);

  /** Trigger the (one-shot, cached) feature-flag fetch. */
  loadAuditFeatureFlag() {
    this.auditFlagRequested.set(true);
  }

  /**
   * Backend feature flags (same `/actuator/features` endpoint the other
   * features use). Only fetched once requested. Failure (e.g. no backend in a
   * static deployment) resolves to empty flags, so the feature reads as
   * disabled rather than erroring.
   */
  private readonly featureFlags = resource({
    params: () => (this.auditFlagRequested() ? {} : undefined),
    loader: async () => {
      try {
        return await firstValueFrom(
          this.httpClient.get<FeatureFlags>(
            environment.API_PROXY_PREFIX + "/actuator/features",
          ),
        );
      } catch (err) {
        Logging.debug("features API not available", err);
        return {} as FeatureFlags;
      }
    },
  });

  /**
   * Whether change logging is enabled on the backend. Tri-state for
   * {@link FeatureDisabledInfoComponent}: `undefined` until the flag has loaded,
   * then `true`/`false`.
   */
  readonly isAuditEnabled = computed<boolean | undefined>(() => {
    if (!this.auditFlagRequested() || this.featureFlags.isLoading()) {
      return undefined;
    }
    return this.featureFlags.value()?.["audit"]?.enabled ?? false;
  });

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
   * Whether this entity qualifies for a change-history entry at all: a saved,
   * non-internal record. This gates the *visibility* of the entry point and is
   * deliberately permission-agnostic — every user should see that the feature
   * exists (the dialog itself shows a message if they lack access).
   */
  canSeeHistoryEntry(entity?: Entity): boolean {
    return (
      !!entity && !entity.isNew && !entity.getConstructor().isInternalEntity
    );
  }

  /**
   * Whether the current user may read the audit data. Fails closed: if the
   * permission engine is not available, access to this permission-gated audit
   * data is denied.
   */
  hasHistoryPermission(): boolean {
    return !!this.ability && this.ability.can("read", AUDIT_RECORD_SUBJECT);
  }

  /** Both: the entity qualifies and the user may read its audit data. */
  canViewHistory(entity?: Entity): boolean {
    return this.canSeeHistoryEntry(entity) && this.hasHistoryPermission();
  }
}
