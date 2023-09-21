import { Injectable } from "@angular/core";
import { AuthUser } from "../auth-user";

@Injectable({
  providedIn: "root",
})
export class LocalAuthService {
  private readonly STORED_USER_PREFIX = "USER-";

  getStoredUsers(): AuthUser[] {
    return Object.entries(localStorage)
      .filter(([key]) => key.startsWith(this.STORED_USER_PREFIX))
      .map(([_, user]) => JSON.parse(user));
  }

  /**
   * Saves a user to the local storage
   * @param user a object holding the username and the roles of the user
   */
  saveUser(user: AuthUser) {
    localStorage.setItem(
      this.STORED_USER_PREFIX + user.name,
      JSON.stringify(user),
    );
  }
}
