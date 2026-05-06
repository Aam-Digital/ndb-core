import { Injectable } from "@angular/core";
import { SessionInfo } from "../session-info";
import { environment } from "../../../../../environments/environment";
import { SessionType } from "../../session-type";

/**
 * Manages the offline login.
 */
@Injectable({
  providedIn: "root",
})
export class LocalAuthService {
  private readonly STORED_USER_PREFIX = "USER-";

  /**
   * Get a list of users stored in the local storage that have an existing local database.
   * Users without a local IndexedDB are filtered out (e.g. stale entries from online-only logins).
   */
  async getStoredUsers(): Promise<SessionInfo[]> {
    const users: SessionInfo[] = Object.entries(localStorage)
      .filter(([key]) => key.startsWith(this.STORED_USER_PREFIX))
      .map(([_, user]) => JSON.parse(user));

    if (users.length === 0) {
      return [];
    }

    const existingDbNames = await this.listIndexedDbNames();
    return users.filter((user) => this.hasLocalDatabase(user, existingDbNames));
  }

  /**
   * Check whether a user has an existing local PouchDB in IndexedDB.
   * PouchDB prefixes IndexedDB database names with "_pouch_".
   * Checks both the current UUID-based name (<id>-app) and the legacy username-based name (<name>-app).
   */
  private hasLocalDatabase(user: SessionInfo, dbNames: Set<string>): boolean {
    return (
      dbNames.has(`_pouch_${user.id}-app`) ||
      dbNames.has(`_pouch_${user.name}-app`)
    );
  }

  /**
   * List all IndexedDB database names, or return an empty set if the API is unavailable.
   */
  private async listIndexedDbNames(): Promise<Set<string>> {
    try {
      if (typeof indexedDB?.databases === "function") {
        const dbs = await indexedDB.databases();
        return new Set(dbs.map((db) => db.name).filter(Boolean));
      }
    } catch {
      // API not available (e.g. SSR or restricted context)
    }
    // If API is not available, allow all stored users (safe fallback)
    return new Set(
      Object.entries(localStorage)
        .filter(([key]) => key.startsWith(this.STORED_USER_PREFIX))
        .map(([_, user]) => {
          const u: SessionInfo = JSON.parse(user);
          return `_pouch_${u.id}-app`;
        }),
    );
  }

  /**
   * Saves a user to the local storage so they can log in offline later.
   * Has no effect in online-only mode, since no local database is available.
   */
  saveUser(user: SessionInfo) {
    if (environment.session_type === SessionType.online) {
      return;
    }
    localStorage.setItem(
      this.STORED_USER_PREFIX + user.name,
      JSON.stringify(user),
    );
  }
}
