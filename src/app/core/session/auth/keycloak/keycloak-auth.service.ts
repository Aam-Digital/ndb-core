import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { parseJwt } from "../../../../utils/utils";
import { environment } from "../../../../../environments/environment";
import { SessionInfo } from "../session-info";
import { KeycloakService } from "keycloak-angular";

/**
 * Handles the remote session with keycloak
 */
@Injectable()
export class KeycloakAuthService {
  /**
   * Users with this role can create and update other accounts.
   */
  static readonly ACCOUNT_MANAGER_ROLE = "account_manager";
  static readonly LAST_AUTH_KEY = "LAST_REMOTE_LOGIN";
  private keycloakInitialised = false;
  accessToken: string;

  constructor(
    private httpClient: HttpClient,
    private keycloak: KeycloakService,
  ) {}

  /**
   * Check for a existing session or forward to the login page.
   */
  async login(): Promise<SessionInfo> {
    if (!this.keycloakInitialised) {
      this.keycloakInitialised = true;
      const loggedIn = await this.keycloak.init({
        config: window.location.origin + "/assets/keycloak.json",
        initOptions: {
          onLoad: "check-sso",
          silentCheckSsoRedirectUri:
            window.location.origin + "/assets/silent-check-sso.html",
        },
        // GitHub API rejects if non GitHub bearer token is present
        shouldAddToken: ({ url }) => !url.includes("api.github.com"),
      });
      if (!loggedIn) {
        // Forward to the keycloak login page.
        await this.keycloak.login({ redirectUri: location.href });
      }
    }

    return this.keycloak
      .updateToken()
      .then(() => this.keycloak.getToken())
      .then((token) => this.processToken(token));
  }

  private processToken(token: string): SessionInfo {
    if (!token) {
      throw new Error();
    }
    this.accessToken = token;
    this.logSuccessfulAuth();
    const parsedToken = parseJwt(this.accessToken);
    if (!parsedToken.username) {
      throw new Error(
        `Login error: User is not correctly set up (userId: ${parsedToken.sub})`,
      );
    }
    return {
      name: parsedToken.username,
      roles: parsedToken["_couchdb.roles"],
    };
  }

  /**
   * Add the Bearer auth header to a existing header object.
   * @param headers
   */
  addAuthHeader(headers: any) {
    if (this.accessToken) {
      if (headers.set && typeof headers.set === "function") {
        // PouchDB headers are set as a map
        headers.set("Authorization", "Bearer " + this.accessToken);
      } else {
        // Interceptor headers are set as a simple object
        headers["Authorization"] = "Bearer " + this.accessToken;
      }
    }
  }

  /**
   * Forward to the keycloak logout endpoint to clear the session.
   */
  async logout() {
    return this.keycloak.logout(location.href);
  }

  /**
   * Open password reset page in browser.
   * Only works with internet connection.
   */
  changePassword(): Promise<any> {
    return this.keycloak.login({
      action: "UPDATE_PASSWORD",
      redirectUri: location.href,
    });
  }

  getUserinfo(): Promise<KeycloakUser> {
    return this.keycloak
      .getKeycloakInstance()
      .loadUserInfo() as Promise<KeycloakUser>;
  }

  setEmail(email: string): Observable<any> {
    return this.httpClient.put(`${environment.account_url}/account/set-email`, {
      email,
    });
  }

  createUser(user: Partial<KeycloakUser>): Observable<any> {
    return this.httpClient.post(`${environment.account_url}/account`, user);
  }

  updateUser(userId: string, user: Partial<KeycloakUser>): Observable<any> {
    return this.httpClient.put(
      `${environment.account_url}/account/${userId}`,
      user,
    );
  }

  getUser(username: string): Observable<KeycloakUser> {
    return this.httpClient.get<KeycloakUser>(
      `${environment.account_url}/account/${username}`,
    );
  }

  /**
   * Get a list of all roles generally available in the user management system.
   */
  getRoles(): Observable<Role[]> {
    return this.httpClient.get<Role[]>(
      `${environment.account_url}/account/roles`,
    );
  }

  /**
   * Log timestamp of last successful authentication
   */
  logSuccessfulAuth() {
    localStorage.setItem(
      KeycloakAuthService.LAST_AUTH_KEY,
      new Date().toISOString(),
    );
  }
}

/**
 * Extract of Keycloak role object.
 * See {@link https://www.keycloak.org/docs-api/19.0.3/rest-api/index.html#_rolerepresentation}
 */
export interface Role {
  id: string;
  name: string;
  description: string;
}

/**
 * Extract of Keycloak user object.
 * See {@link https://www.keycloak.org/docs-api/19.0.3/rest-api/index.html#_userrepresentation}
 */
export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  enabled: boolean;
}
