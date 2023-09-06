import { Injectable } from "@angular/core";
import { AuthUser } from "../auth-user";

@Injectable({
  providedIn: "root",
})
export class LocalAuthService {
  private static LAST_LOGGED_IN_KEY = "LAST_USER";

  login(): AuthUser {
    return this.getStoredUser(LocalAuthService.LAST_LOGGED_IN_KEY);
  }

  canLoginOffline(): boolean {
    return !!localStorage.getItem(LocalAuthService.LAST_LOGGED_IN_KEY);
  }

  private getStoredUser(username: string): AuthUser {
    const stored = window.localStorage.getItem(username);
    return JSON.parse(stored);
  }

  /**
   * Saves a user to the local storage
   * @param user a object holding the username and the roles of the user
   */
  saveUser(user: AuthUser) {
    window.localStorage.setItem(
      LocalAuthService.LAST_LOGGED_IN_KEY,
      JSON.stringify(user),
    );
  }

  removeLastUser() {
    window.localStorage.removeItem(LocalAuthService.LAST_LOGGED_IN_KEY);
  }
}
