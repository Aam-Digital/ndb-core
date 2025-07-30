import { DatabaseException, PouchDatabase } from "./pouch-database";
import { environment } from "../../../../environments/environment";
import PouchDB from "pouchdb-browser";
import { Logging } from "../../logging/logging.service";
import { HttpStatusCode } from "@angular/common/http";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { SyncStateSubject } from "app/core/session/session-type";

/**
 * An alternative implementation of PouchDatabase that directly makes HTTP requests to a remote CouchDB.
 */
export class RemotePouchDatabase extends PouchDatabase {
  /**
   * Whether the session is not logging in any user (e.g. for public forms).
   * @private
   */
  private unauthenticatedSession?: boolean;

  constructor(
    dbName: string,
    private authService: KeycloakAuthService,
    globalSyncState?: SyncStateSubject,
  ) {
    super(dbName, globalSyncState);
  }

  /**
   * Initializes the PouchDB with the http adapter to directly access a remote CouchDB without replication
   * See {@link https://pouchdb.com/adapters.html#pouchdb_over_http}
   * @param dbName (relative) path to the remote database
   */
  override init(dbName?: string, unauthenticatedSession?: boolean) {
    this.unauthenticatedSession = unauthenticatedSession;

    if (dbName) {
      this.dbName = dbName;
    }

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
  }

  private defaultFetch: Fetch = async (url: string | Request, opts: any) => {
    if (typeof url !== "string") {
      const err = new Error("PouchDatabase.fetch: url is not a string");
      err["details"] = url;
      throw err;
    }

    const remoteUrl =
      environment.DB_PROXY_PREFIX + url.split(environment.DB_PROXY_PREFIX)[1];
    this.authService.addAuthHeader(opts.headers);

    let result: Response;
    try {
      result = await PouchDB.fetch(remoteUrl, opts);
    } catch (err) {
      Logging.debug("navigator.onLine", navigator.onLine);
      Logging.warn("Failed to fetch from DB", err);
    }

    // retry login if request failed with unauthorized
    if (
      result.status === HttpStatusCode.Unauthorized &&
      !this.unauthenticatedSession
    ) {
      try {
        await this.authService.login();
        this.authService.addAuthHeader(opts.headers);
        result = await PouchDB.fetch(remoteUrl, opts);
      } catch (err) {
        Logging.debug("navigator.onLine", navigator.onLine);
        Logging.warn("Failed to fetch from DB", err);
      }
    }

    if (!result || result.status >= 500) {
      Logging.debug("Actual DB Fetch response", result);
      Logging.debug("navigator.onLine", navigator.onLine);
      throw new DatabaseException({
        error: "Failed to fetch from DB",
        actualResponse: JSON.stringify(result),
        actualResponseBody: await result?.text(),
      });
    }

    return result;
  };
}
