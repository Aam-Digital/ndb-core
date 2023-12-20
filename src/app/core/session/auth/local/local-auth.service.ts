import { Injectable } from "@angular/core";
import { SessionInfo } from "../session-info";

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
   * Saves a user to the local storage
   * @param user a object holding the username and the roles of the user
   */
  saveUser(user: SessionInfo) {
    localStorage.setItem(
      this.STORED_USER_PREFIX + user.entityId,
      JSON.stringify(user),
    );
  }
}
