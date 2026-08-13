import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Logging } from "../../core/logging/logging.service";
import { environment } from "../../../environments/environment";
import { DatabaseFactoryService } from "../../core/database/database-factory.service";
import { Database } from "../../core/database/database";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { Entity } from "../../core/entity/model/entity";
import {
  ChangeEvent,
  ChangeLogEntry,
  ChangeLogFilters,
} from "./change-history.types";
import { buildChangeEvents, RawAuditDoc } from "./change-history-normalize";
import { KeycloakAuthService } from "../../core/session/auth/keycloak/keycloak-auth.service";
import {
  AUDIT_TIMESTAMP_INDEX,
  buildAuthorSampleQuery,
  buildChangeLogQuery,
  distinctAuthors,
  MangoQuery,
  toChangeLogEntry,
} from "./change-log-query";

/** CASL subject the audit records are keyed under (see replication-backend #4026). */
export const AUDIT_RECORD_SUBJECT = "AuditRecord";

/** Response of the replication-backend central `GET /_features` endpoint. */
interface AuditFeatureStatus {
  audit: { enabled: boolean };
}

/** Response of the audit database's `_find` endpoint, as proxied by the backend. */
interface FindResponse {
  docs: RawAuditDoc[];
}

/** One page of the system-wide change log. */
export interface ChangeLogPage {
  entries: ChangeLogEntry[];
  /** whether at least one further page exists after this one */
  hasMore: boolean;
}

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
  private readonly authService = inject(KeycloakAuthService, {
    optional: true,
  });

  /**
   * Bumped on every ability update. The ability object is mutated in place when
   * rules change (permission config edited, session or user switched), so its
   * "updated" event is the only signal that a permission answer may differ now.
   */
  private readonly abilityUpdated = signal(0);

  constructor() {
    // `on` is guarded rather than assumed: the ability is optional here, and a
    // test double may only implement the permission check itself
    this.ability?.on?.("updated", () =>
      this.abilityUpdated.update((count) => count + 1),
    );
  }

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

  private auditDb?: Database;

  /** in-flight or completed creation of the change log's index, attempted once */
  private indexCreated?: Promise<void>;

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
   * Fetch one page of the system-wide change log, newest first.
   *
   * Unlike {@link getHistory}, this cannot go through the audit db's PouchDB
   * handle: audit `_id`s are keyed by entity id, so `_all_docs` orders by
   * record, not by time. A Mango query sorted on `timestamp` is used instead,
   * via the backend's proxied `_find` endpoint (PouchDB has no `find` here:
   * the `pouchdb-find` plugin is not installed).
   *
   * The query asks for one record beyond the page, which is reported as
   * {@link ChangeLogPage.hasMore} rather than returned, so the caller never
   * offers a next page that turns out to be empty.
   *
   * @throws if the audit database is unavailable or the query is rejected
   */
  async queryChangeLog(
    filters: ChangeLogFilters,
    pageSize: number,
    pageIndex = 0,
  ): Promise<ChangeLogPage> {
    await this.ensureTimestampIndex();
    const response = await this.findInAuditDb(
      buildChangeLogQuery(filters, pageSize, pageIndex),
    );
    const docs = response.docs ?? [];
    return {
      entries: docs.slice(0, pageSize).map(toChangeLogEntry),
      hasMore: docs.length > pageSize,
    };
  }

  /**
   * The authors to offer in the change log's "changed by" filter, sampled from
   * the most recent records (see AUTHOR_SAMPLE_SIZE) since the audit database
   * holds no index of its authors.
   */
  async getChangeAuthors(): Promise<string[]> {
    await this.ensureTimestampIndex();
    const response = await this.findInAuditDb(buildAuthorSampleQuery());
    return distinctAuthors(response.docs ?? []);
  }

  /**
   * Create the timestamp index the change log sorts on, once per session.
   * Creating an existing index is a no-op in CouchDB, so this is safe to repeat
   * and needs no prior existence check.
   */
  private async ensureTimestampIndex(): Promise<void> {
    this.indexCreated ??= firstValueFrom(
      this.httpClient.post(
        `${environment.DB_PROXY_PREFIX}/${ChangeHistoryService.auditDbName()}/_index`,
        AUDIT_TIMESTAMP_INDEX,
        { headers: this.auditRequestHeaders() },
      ),
    ).then(() => undefined);

    try {
      await this.indexCreated;
    } catch (err) {
      // a failure here is not necessarily fatal: the index may already exist
      // from an earlier session, in which case the query below still works
      Logging.debug("could not ensure the audit timestamp index", err);
      this.indexCreated = undefined;
    }
  }

  private findInAuditDb(query: MangoQuery): Promise<FindResponse> {
    return firstValueFrom(
      this.httpClient.post<FindResponse>(
        `${environment.DB_PROXY_PREFIX}/${ChangeHistoryService.auditDbName()}/_find`,
        query,
        { headers: this.auditRequestHeaders() },
      ),
    );
  }

  /**
   * Headers for a direct call to the proxied audit database. The bearer token is
   * added explicitly because these requests do not go through PouchDB's
   * authenticating fetch, and no HTTP interceptor supplies it.
   */
  private auditRequestHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "ngsw-bypass": "true" };
    this.authService?.addAuthHeader(headers);
    return headers;
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
    return !!this.ability && this.ability.can("read", AUDIT_RECORD_SUBJECT);
  }

  /**
   * {@link hasHistoryPermission} as a signal, for long-lived views that must not
   * keep showing a "no access" state after the user's rules have changed.
   */
  readonly hasAuditPermission = computed(() => {
    this.abilityUpdated();
    return this.hasHistoryPermission();
  });

  /** Both: the entity qualifies and the user may read its audit data. */
  canViewHistory(entity?: Entity): boolean {
    return this.canSeeHistoryEntry(entity) && this.hasHistoryPermission();
  }
}
