import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, NEVER, Observable } from "rxjs";
import { parseJwt } from "../../../../utils/utils";
import { environment } from "../../../../../environments/environment";
import { AuthUser } from "../auth-user";
import { KeycloakService } from "keycloak-angular";
import { SessionType } from "../../session-type";

@Injectable()
export class KeycloakAuthService {
  static readonly LAST_AUTH_KEY = "LAST_REMOTE_LOGIN";
  /**
   * Users with this role can create and update other accounts.
   */
  static readonly ACCOUNT_MANAGER_ROLE = "account_manager";
  static readonly REFRESH_TOKEN_KEY = "REFRESH_TOKEN";

  public accessToken: string;

  private keycloakReady: Promise<boolean> = firstValueFrom(NEVER);

  constructor(
    private httpClient: HttpClient,
    private keycloak: KeycloakService,
  ) {
    if (environment.session_type === SessionType.synced) {
      this.keycloakReady = this.keycloak.init({
        config: window.location.origin + "/assets/keycloak.json",
        initOptions: {
          onLoad: "check-sso",
          silentCheckSsoRedirectUri:
            window.location.origin + "/assets/silent-check-sso.html",
        },
        // GitHub API rejects if non GitHub bearer token is present
        shouldAddToken: ({ url }) => !url.includes("api.github.com"),
      });
    }
  }

  authenticate() {
    this.keycloak.login({
      redirectUri: location.href,
    });
  }

  autoLogin(): Promise<AuthUser> {
    return this.keycloakReady
      .then(() => this.keycloak.updateToken())
      .then(() => this.keycloak.getToken())
      .then((token) => this.processToken(token));
  }

  private processToken(token: string): AuthUser {
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

  addAuthHeader(headers: any) {
    if (this.accessToken) {
      if (headers.set && typeof headers.set === "function") {
        // PouchDB headers are set as a map
        headers.set("Authorization", "Bearer " + this.accessToken);
        console.log("setting", headers);
      } else {
        // Interceptor headers are set as a simple object
        headers["Authorization"] = "Bearer " + this.accessToken;
      }
    }
  }

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

  getUserinfo() {
    return this.keycloak.loadUserProfile();
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
