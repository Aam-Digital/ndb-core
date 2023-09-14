import { AuthService } from "../auth.service";
import { Injectable } from "@angular/core";
import Keycloak from "keycloak-js";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpStatusCode,
} from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import { parseJwt } from "../../../../utils/utils";
import { environment } from "../../../../../environments/environment";
import { AuthUser } from "../../session-service/auth-user";
import { catchError } from "rxjs/operators";

@Injectable()
export class KeycloakAuthService extends AuthService {
  /**
   * Users with this role can create and update other accounts.
   */
  static readonly ACCOUNT_MANAGER_ROLE = "account_manager";
  static readonly REFRESH_TOKEN_KEY = "REFRESH_TOKEN";

  public accessToken: string;

  private keycloak = new Keycloak("assets/keycloak.json");
  private keycloakReady = this.keycloak.init({});

  constructor(private httpClient: HttpClient) {
    super();
  }

  get realmUrl(): string {
    return `${this.keycloak.authServerUrl}realms/${this.keycloak.realm}`;
  }

  authenticate(username: string, password: string): Promise<AuthUser> {
    return this.keycloakReady
      .then(() => this.credentialAuth(username.trim(), password))
      .then((token) => this.processToken(token));
  }

  autoLogin(): Promise<AuthUser> {
    return this.keycloakReady
      .then(() => this.refreshTokenAuth())
      .then((token) => this.processToken(token));
  }

  private credentialAuth(
    username: string,
    password: string,
  ): Promise<OIDCTokenResponse> {
    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);
    body.set("grant_type", "password");
    return this.getToken(body);
  }

  private refreshTokenAuth(): Promise<OIDCTokenResponse> {
    const body = new URLSearchParams();
    const token = localStorage.getItem(KeycloakAuthService.REFRESH_TOKEN_KEY);
    body.set("refresh_token", token);
    body.set("grant_type", "refresh_token");
    return this.getToken(body);
  }

  private getToken(body: URLSearchParams): Promise<OIDCTokenResponse> {
    body.set("client_id", "app");
    const headers = new HttpHeaders().set(
      "Content-Type",
      "application/x-www-form-urlencoded",
    );
    return firstValueFrom(
      this.httpClient
        .post<OIDCTokenResponse>(
          `${this.realmUrl}/protocol/openid-connect/token`,
          body.toString(),
          { headers },
        )
        .pipe(
          catchError((err) => {
            // treat all invalid grants as unauthorized
            if (err?.error?.error === "invalid_grant") {
              const status = HttpStatusCode.Unauthorized;
              throw new HttpErrorResponse({ status });
            } else {
              throw err;
            }
          }),
        ),
    );
  }

  private processToken(token: OIDCTokenResponse): AuthUser {
    this.accessToken = token.access_token;
    localStorage.setItem(
      KeycloakAuthService.REFRESH_TOKEN_KEY,
      token.refresh_token,
    );
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
      } else {
        // Interceptor headers are set as a simple object
        headers["Authorization"] = "Bearer " + this.accessToken;
      }
    }
  }

  async logout() {
    window.localStorage.removeItem(KeycloakAuthService.REFRESH_TOKEN_KEY);
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

  getUserinfo(): Observable<any> {
    return this.httpClient.get(
      `${this.realmUrl}/protocol/openid-connect/userinfo`,
    );
  }

  setEmail(email: string): Observable<any> {
    return this.httpClient.put(`${environment.account_url}/account/set-email`, {
      email,
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.httpClient.post(
      `${environment.account_url}/account/forgot-password`,
      {
        email,
        realm: this.keycloak.realm,
        client: this.keycloak.clientId,
      },
    );
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
}

/**
 * Extract of openId-connect response.
 */
export interface OIDCTokenResponse {
  access_token: string;
  refresh_token: string;
  session_state: string;
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
