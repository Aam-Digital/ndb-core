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
   * Get a list of users stored in the local storage.
   */
  getStoredUsers(): SessionInfo[] {
    return Object.entries(localStorage)
      .filter(([key]) => key.startsWith(this.STORED_USER_PREFIX))
      .map(([_, user]) => JSON.parse(user));
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
