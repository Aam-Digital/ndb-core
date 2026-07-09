import { DatabaseException, PouchDatabase } from "./pouch-database";
import { environment } from "../../../../environments/environment";
import PouchDB from "pouchdb-browser";
import { Logging } from "../../logging/logging.service";
import { HttpStatusCode } from "@angular/common/http";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { SyncStateSubject } from "app/core/session/session-type";
import { SyncState } from "app/core/session/session-states/sync-state.enum";
import { NgZone } from "@angular/core";
import { timer } from "rxjs";
import { exhaustMap, takeUntil } from "rxjs/operators";
import { AlertService } from "../../alerts/alert.service";
import { isVersionNewer } from "./version-comparison.utils";
import { isConnectivityError } from "#src/app/utils/connectivity-error";

/**
 * 4XX statuses that occur during normal operation
 * (and are handled by callers or the auth layer),
 * so they are not reported to remote logging.
 */
const EXPECTED_4XX_STATUSES: number[] = [
  HttpStatusCode.Unauthorized,
  HttpStatusCode.Forbidden,
  HttpStatusCode.NotFound,
];

/**
 * An alternative implementation of PouchDatabase that directly makes HTTP requests to a remote CouchDB.
 */
export class RemotePouchDatabase extends PouchDatabase {
  /**
   * Whether the session is not logging in any user (e.g. for public forms).
   * @private
   */
  private unauthenticatedSession?: boolean;

  /**
   * Whether to track docs whose permissions were lost as reported by the server.
   * Toggled by {@link SyncedPouchDatabase} to skip tracking on first sync.
   */
  trackLostPermissions?: boolean;

  /**
   * Doc IDs whose permissions were lost as reported by the server in `_changes` responses.
   * Accumulated across all `_changes` calls during a sync and consumed after sync completes.
   */
  private pendingLostPermissions: string[] = [];

  /**
   * Polling interval for changes in milliseconds (for remote-only databases).
   * Avoids long-polling connection issues by using periodic polling instead.
   * @private
   */
  private readonly CHANGES_POLLING_INTERVAL = 10000; // 10 seconds

  /** Cooldown (ms) between user-facing connection issue alerts. */
  private readonly CONNECTION_ALERT_COOLDOWN_MS = 60000;
  private lastConnectionAlertTime = 0;

  constructor(
    dbName: string,
    private authService: KeycloakAuthService,
    globalSyncState?: SyncStateSubject,
    ngZone?: NgZone,
    private readonly alertService?: AlertService,
  ) {
    super(dbName, globalSyncState, ngZone);
  }

  /**
   * Initializes the PouchDB with the http adapter to directly access a remote CouchDB without replication
   * See {@link https://pouchdb.com/adapters.html#pouchdb_over_http}
   * @param dbName (relative) path to the remote database
   * @param config optional configuration for the remote database session
   */
  override init(
    dbName?: string,
    config?: {
      unauthenticatedSession?: boolean;
      trackLostPermissions?: boolean;
    },
  ) {
    this.unauthenticatedSession = config?.unauthenticatedSession;
    this.trackLostPermissions = config?.trackLostPermissions;

    if (dbName) {
      this.dbName = dbName;
    }
    this.pendingLostPermissions = [];

    const options = {
      adapter: "http",
      skip_setup: true,
      fetch: (url: string | Request, opts: RequestInit) =>
        this.defaultFetch(url, opts),
    };
    // add the proxy prefix to the database name so that we get a correct remote URL
    this.pouchDB = new PouchDB(
      `${environment.DB_PROXY_PREFIX}/${this.dbName}`,
      options,
    );
    this.databaseInitialized.complete();

    // No local sync needed — immediately signal that data is available
    this.globalSyncState?.next(SyncState.COMPLETED);
  }

  /**
   * Maximum number of retries for transient network errors (e.g. ERR_NETWORK_CHANGED).
   */
  private readonly TRANSIENT_ERROR_RETRIES = 2;
  private readonly TRANSIENT_ERROR_DELAY_MS = 2000;

  /**
   * Per-request timeout in ms for READ requests only. If the server sends no
   * response within this window, the read fetch is aborted (and retried at the
   * operation level by {@link withReadRetry}). This prevents long-idle
   * connections from being killed unpredictably by Chrome (ERR_NETWORK_CHANGED)
   * or proxies. Writes are never aborted or retried — see
   * {@link fetchWithTimeout}.
   */
  private readonly FETCH_TIMEOUT_MS = 15000;

  private defaultFetch: Fetch = async (url: string | Request, opts: any) => {
    if (typeof url !== "string") {
      const err = new Error("PouchDatabase.fetch: url is not a string");
      err["details"] = url;
      throw err;
    }

    const remoteUrl =
      environment.DB_PROXY_PREFIX + url.split(environment.DB_PROXY_PREFIX)[1];
    this.authService.addAuthHeader(opts.headers);
    // bypass Angular service worker to avoid synthetic 504 errors on network blips
    if (opts.headers?.set && typeof opts.headers.set === "function") {
      opts.headers.set("ngsw-bypass", "true");
    } else if (opts.headers) {
      opts.headers["ngsw-bypass"] = "true";
    }

    let result: Response;
    try {
      result = await this.fetchWithTimeout(remoteUrl, opts);
    } catch (err) {
      Logging.debug("Failed initial fetch from DB", err);
      Logging.debug("navigator.onLine", navigator.onLine);
      this.showConnectionIssueAlert();
    }

    // Retry login if request failed with unauthorized.
    // This will redirect to Keycloak if the token is expired or missing,
    // which is intentional — it ensures users re-authenticate online
    // when connectivity is available (including after an offline login).
    if (
      result?.status === HttpStatusCode.Unauthorized &&
      !this.unauthenticatedSession
    ) {
      try {
        await this.authService.login();
        this.authService.addAuthHeader(opts.headers);
        result = await PouchDB.fetch(remoteUrl, opts);
      } catch (err) {
        Logging.debug("Failed retried fetch from DB after 401", err);
      }
    }

    if (!result || result.status >= 500) {
      Logging.debug("Actual DB Fetch response", result);
      Logging.debug("navigator.onLine", navigator.onLine);
      throw new DatabaseException({
        message: "Failed to fetch from DB",
        requestedUrl: remoteUrl,
        actualResponse: JSON.stringify(result),
        actualResponseBody: await result?.text(),
      });
    }

    // additional output for debugging
    if (result?.status >= 400) {
      if (this.isNotificationsDatabase() && result.status === 404) {
        Logging.debug(
          "Notifications database not found (404) - may be expected",
        );
      } else if (EXPECTED_4XX_STATUSES.includes(result.status)) {
        // expired session (401), permission-filtered doc (403) and missing doc (404)
        // are part of normal operation and handled by callers
        Logging.debug("Failed to fetch from DB with 40X error", result);
      } else {
        Logging.warn("Failed to fetch from DB with 40X error", result);
      }
    }

    if (
      this.trackLostPermissions &&
      result?.status === HttpStatusCode.Ok &&
      remoteUrl.includes("_changes")
    ) {
      await this.extractLostPermissions(result.clone());
    }

    return result;
  };

  /**
   * Retry idempotent reads that fail with a transient network error
   * (e.g. an abort/timeout on a connection gone stale after the tab was
   * suspended, or ERR_NETWORK_CHANGED).
   *
   * Retrying lives here, at the operation level, rather than in the fetch
   * wrapper: {@link fetchWithTimeout} can only abort while acquiring the
   * response headers, but an abort during response-body streaming surfaces
   * after the fetch has returned — outside the wrapper's reach. Re-issuing the
   * whole read (fresh fetch and body) recovers both cases transparently.
   * Only reads route through this hook; writes must run exactly once
   * (see {@link fetchWithTimeout}).
   */
  protected override async withReadRetry<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await operation();
      } catch (err) {
        if (
          !isConnectivityError(err) ||
          attempt >= this.TRANSIENT_ERROR_RETRIES
        ) {
          throw err;
        }
        Logging.debug(
          `Transient DB read error (attempt ${attempt + 1}/${this.TRANSIENT_ERROR_RETRIES}), retrying...`,
          err,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.TRANSIENT_ERROR_DELAY_MS),
        );
      }
    }
  }

  /**
   * Fetch a request with a per-request timeout so a hung/stale connection is
   * aborted cleanly instead of hanging indefinitely (e.g. after the tab was
   * suspended, or ERR_NETWORK_CHANGED). The abort surfaces as a transient
   * error that {@link withReadRetry} retries at the operation level.
   *
   * Only safe/idempotent read methods (GET, HEAD) get the abort timeout.
   * Non-idempotent writes (PUT, POST, DELETE) are run exactly once with no
   * client-side timeout: a write may have already committed on the server even
   * when the client never sees the response, so aborting it can turn a "create"
   * into a forbidden "update" (the public role is create-only) or create a
   * duplicate — surfacing as spurious "unauthorized" errors. Letting the write
   * run to completion ensures the client reliably learns the new `_rev`.
   */
  private async fetchWithTimeout(
    url: string,
    opts: RequestInit,
  ): Promise<Response> {
    const method = (opts.method ?? "GET").toUpperCase();
    const isSafeMethod = method === "GET" || method === "HEAD";

    if (!isSafeMethod) {
      // Write: run once, to completion, without abort timeout.
      return PouchDB.fetch(url, opts);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.FETCH_TIMEOUT_MS,
    );
    try {
      return await PouchDB.fetch(url, { ...opts, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private showConnectionIssueAlert(): void {
    const now = Date.now();
    if (
      now - this.lastConnectionAlertTime <
      this.CONNECTION_ALERT_COOLDOWN_MS
    ) {
      return;
    }
    this.lastConnectionAlertTime = now;
    this.alertService?.addWarning(
      $localize`We are observing connection issues while syncing your data. Sync continues and retries automatically but may take longer than usual.`,
    );
  }

  /**
   * Parse `lostPermissions` from a `_changes` response and accumulate them
   * for later retrieval via {@link collectAndClearLostPermissions}.
   *
   * Awaited inside `defaultFetch` to ensure items are collected before the
   * fetch resolves — preventing a race with `collectAndClearLostPermissions`.
   */
  private async extractLostPermissions(response: Response): Promise<void> {
    try {
      const body = await response.json();
      if (body.lostPermissions?.length) {
        this.pendingLostPermissions.push(...body.lostPermissions);
      }
    } catch (err) {
      Logging.debug(
        "Could not parse lostPermissions from _changes response",
        err,
      );
    }
  }

  /**
   * Returns all doc IDs whose permissions were lost since the last sync
   * (as reported in `_changes` responses intercepted during that sync)
   * and resets the internal list.
   */
  collectAndClearLostPermissions(): string[] {
    const collected = this.pendingLostPermissions;
    this.pendingLostPermissions = [];
    return collected;
  }

  protected override shouldSkipIndexUpdate(existingDesignDoc: any): boolean {
    if (
      existingDesignDoc.aam_version &&
      isVersionNewer(existingDesignDoc.aam_version, environment.appVersion)
    ) {
      Logging.debug(
        `skipping index update for ${existingDesignDoc._id}: server has version ${existingDesignDoc.aam_version}, we are ${environment.appVersion}`,
      );
      return true;
    }
    return false;
  }

  /**
   * Poll the _changes endpoint periodically to detect document changes.
   * Emits individual documents that have changed since the last poll.
   *
   * Overridden to use periodic polling instead of live long-polling.
   * This avoids connection stability issues with remote-only (anonymous) sessions.
   * Changes are fetched at regular intervals rather than maintaining a persistent connection.
   *
   * @private
   */
  protected override async subscribeChanges() {
    const db = await this.getPouchDBOnceReady();
    let lastSequence: string | number = "now";

    // Run the polling loop outside Angular's zone to avoid:
    //  - a full app-wide change-detection cycle for every poll fetch
    //  - PouchDB-internal promise rejections being routed to Angular's
    //    ErrorHandler / Sentry. We re-enter the zone explicitly only when
    //    emitting to changesFeed so subscribers still trigger CD.
    const startPolling = () =>
      timer(0, this.CHANGES_POLLING_INTERVAL)
        .pipe(
          exhaustMap(async () => {
            try {
              const result = await db.changes({
                since: lastSequence,
                include_docs: true,
              });

              if (result?.results) {
                result.results.forEach(
                  (change: PouchDB.Core.ChangesResponseChange<{}>) => {
                    if (this.ngZone) {
                      this.ngZone.run(() => this.changesFeed.next(change.doc));
                    } else {
                      this.changesFeed.next(change.doc);
                    }
                  },
                );
                lastSequence = result.last_seq;
              }

              return result;
            } catch (err) {
              Logging.debug("Error polling changes from remote database", err);
              // Continue polling despite errors
              return null;
            }
          }),
          takeUntil(this.destroy$),
        )
        .subscribe();

    if (this.ngZone) {
      this.ngZone.runOutsideAngular(startPolling);
    } else {
      startPolling();
    }

    Logging.debug(
      `Started periodic changes polling for ${this.dbName} (interval: ${this.CHANGES_POLLING_INTERVAL}ms)`,
    );
  }
}
