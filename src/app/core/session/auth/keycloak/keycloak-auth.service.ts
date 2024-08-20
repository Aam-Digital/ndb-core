import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { SessionInfo } from "../session-info";
import { KeycloakEventType, KeycloakService } from "keycloak-angular";
import { Logging } from "../../../logging/logging.service";
import { Entity } from "../../../entity/model/entity";
import { User } from "../../../user/user";
import { ParsedJWT, parseJwt } from "../../../../session/session-utils";
import { RemoteLoginNotAvailableError } from "./remote-login-not-available.error";
import { switchMap } from "rxjs/operators";

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
   * Check for an existing session or forward to the login page.
   */
  async login(): Promise<SessionInfo> {
    if (!this.keycloakInitialised) {
      await this.initKeycloak();
    }

    await this.keycloak.updateToken();
    let token = await this.keycloak.getToken();
    if (!token) {
      // Forward to the keycloak login page.
      await this.keycloak.login({ redirectUri: location.href });
      token = await this.keycloak.getToken();
    }

    return this.processToken(token);
  }

  private async initKeycloak() {
    try {
      await this.keycloak.init({
        config: window.location.origin + "/assets/keycloak.json",
        initOptions: {
          onLoad: "check-sso",
          silentCheckSsoRedirectUri:
            window.location.origin + "/assets/silent-check-sso.html",
        },
        // GitHub API rejects if non GitHub bearer token is present
        shouldAddToken: ({ url }) => !url.includes("api.github.com"),
      });
    } catch (err) {
      if (
        err?.error ===
        "Timeout when waiting for 3rd party check iframe message."
      ) {
        // this is actually an expected scenario, user's internet is slow or not available
        err = new RemoteLoginNotAvailableError();
      } else {
        Logging.error("Keycloak init failed", err);
      }

      this.keycloakInitialised = false;
      throw err;
    }

    // auto-refresh expiring tokens, as suggested by https://github.com/mauriciovigolo/keycloak-angular?tab=readme-ov-file#keycloak-js-events
    this.keycloak.keycloakEvents$.subscribe((event) => {
      if (event.type == KeycloakEventType.OnTokenExpired) {
        this.login().catch((err) =>
          Logging.debug("automatic token refresh failed", err),
        );
      }
    });

    this.keycloakInitialised = true;
  }

  private processToken(token: string): SessionInfo {
    if (!token) {
      throw new Error("No token received from Keycloak");
    }

    this.accessToken = token;
    this.logSuccessfulAuth();
    const parsedToken: ParsedJWT = parseJwt(this.accessToken);

    const sessionInfo: SessionInfo = {
      name: parsedToken.username ?? parsedToken.sub,
      id: parsedToken.sub,
      roles: parsedToken["_couchdb.roles"],
      email: parsedToken.email,
    };

    if (parsedToken.username) {
      sessionInfo.entityId = parsedToken.username.includes(":")
        ? parsedToken.username
        : Entity.createPrefixedId(User.ENTITY_TYPE, parsedToken.username);
    } else {
      Logging.debug(
        `User not linked with an entity (userId: ${sessionInfo.id} | ${sessionInfo.name})`,
      );
    }

    if (parsedToken.email) {
      sessionInfo.email = parsedToken.email;
    }

    return sessionInfo;
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
    return await this.keycloak.logout(location.href);
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

  async getUserinfo(): Promise<KeycloakUserDto> {
    const user = await this.keycloak.getKeycloakInstance().loadUserInfo();
    return user as KeycloakUserDto;
  }

  setEmail(email: string): Observable<any> {
    return this.httpClient.put(`${environment.account_url}/account/set-email`, {
      email,
    });
  }

  createUser(user: Partial<KeycloakUserDto>): Observable<any> {
    return this.httpClient.post(`${environment.account_url}/account`, user);
  }

  deleteUser(username: string): Observable<any> {
    return this.getUser(username).pipe(
      switchMap((value) =>
        this.httpClient.delete(
          `${environment.account_url}/account/${value.id}`,
        ),
      ),
    );
  }

  updateUser(userId: string, user: Partial<KeycloakUserDto>): Observable<any> {
    return this.httpClient.put(
      `${environment.account_url}/account/${userId}`,
      user,
    );
  }

  getUser(username: string): Observable<KeycloakUserDto> {
    return this.httpClient.get<KeycloakUserDto>(
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
 * Extract of Keycloak user object as provided by the external Keycloak Service.
 * See {@link https://www.keycloak.org/docs-api/19.0.3/rest-api/index.html#_userrepresentation}
 *
 * These fields overlap with our internal `SessionInfo` interface that is seen as abstracted from Keycloak.
 */
export interface KeycloakUserDto {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  enabled: boolean;
}
