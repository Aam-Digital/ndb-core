import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Logging } from "../../core/logging/logging.service";
import { environment } from "../../../environments/environment";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { AuditRecord } from "./model/audit-record";
import { DataFilter } from "../../core/filter/filters/filters";
import { Database } from "../../core/database/database";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { Entity } from "../../core/entity/model/entity";
import { ChangeEvent } from "./change-history.types";
import { buildChangeEvents, RawAuditDoc } from "./change-history-normalize";
import { KeycloakAuthService } from "../../core/session/auth/keycloak/keycloak-auth.service";

/** Response of the replication-backend central `GET /_features` endpoint. */
interface AuditFeatureStatus {
  audit: { enabled: boolean };
}

/**
 * How many of the most recent audit records the author filter samples. The
 * audit database has no index of its authors, so the options can only come from
 * a bounded look at recent data.
 */
const AUTHOR_SAMPLE_SIZE = 1000;

/**
 * Reads an entity's change history from the audit database recorded by the
 * replication-backend (issue #4026).
 *
 * The audit database is registered as a remote-only database of the AuditRecord
 * entity type, so it is never synced locally - it grows unboundedly. Records are
 * keyed `AuditRecord:<entityId>:<ts>:<rev>`, so a single `_id` prefix range
 * query returns one entity's full history with no extra index.
 */
@Injectable({ providedIn: "root" })
export class ChangeHistoryService {
  private readonly dbResolver = inject(DatabaseResolverService);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly ability = inject(EntityAbility, { optional: true });
  private readonly httpClient = inject(HttpClient);
  private readonly authService = inject(KeycloakAuthService, {
    optional: true,
  });

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
   * Feature status from the replication-backend's central `GET /_features`
   * endpoint (reached via the `/db` proxy). The `audit` flag reflects that
   * backend's own `AUDIT_ENABLED`, so there is no separate flag to keep in sync.
   * Only fetched once requested. Failure (e.g. no backend in a static
   * deployment) resolves to disabled rather than erroring.
   */
  private readonly featureFlags = resource({
    params: () => (this.auditFlagRequested() ? {} : undefined),
    loader: async () => {
      try {
        return await firstValueFrom(
          this.httpClient.get<AuditFeatureStatus>(
            environment.DB_PROXY_PREFIX + "/_features",
          ),
        );
      } catch (err) {
        Logging.debug("feature status not available", err);
        return { audit: { enabled: false } } satisfies AuditFeatureStatus;
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
    return this.featureFlags.value()?.audit?.enabled ?? false;
  });

  private getAuditDb(): Database {
    return this.dbResolver.getDatabase(AuditRecord.DATABASE);
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
   * The authors to offer in the change log's "changed by" filter, sampled from
   * the most recent records since the audit database holds no index of its
   * authors.
   *
   * Goes through the entity layer like the list itself, so it reuses the same
   * sort index rather than creating one of its own.
   */
  async getChangeAuthors(): Promise<string[]> {
    const res = await this.entityMapper.findType(
      AuditRecord,
      // the same constraint the list's own filter carries, for the same reason:
      // it names the index that answers the query rather than requiring one
      { timestamp: { $gt: null } } as DataFilter<AuditRecord>,
      { limit: AUTHOR_SAMPLE_SIZE },
      { prop: "timestamp", dir: "desc" },
    );
    const authors = new Set(
      res.records.map((record) => record.author).filter(Boolean),
    );
    return [...authors].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Whether this entity qualifies for a change-history entry at all: any saved
   * record. Internal entities (e.g. PublicFormConfig) are audited too, so they
   * also qualify. This gates the *visibility* of the entry point and is
   * deliberately permission-agnostic — every user should see that the feature
   * exists (the dialog itself shows a message if they lack access).
   */
  canSeeHistoryEntry(entity?: Entity): boolean {
    return !!entity && !entity.isNew;
  }

  /**
   * Whether the current user may read the audit data. Fails closed: if the
   * permission engine is not available, access to this permission-gated audit
   * data is denied.
   */
  hasHistoryPermission(): boolean {
    return !!this.ability && this.ability.can("read", AuditRecord.ENTITY_TYPE);
  }

  /** Both: the entity qualifies and the user may read its audit data. */
  canViewHistory(entity?: Entity): boolean {
    return this.canSeeHistoryEntry(entity) && this.hasHistoryPermission();
  }
}
