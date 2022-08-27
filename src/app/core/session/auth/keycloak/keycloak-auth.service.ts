import { AuthService } from "../auth.service";
import { Injectable } from "@angular/core";
import Keycloak from "keycloak-js";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { DatabaseUser } from "../../session-service/local-user";
import { parseJwt } from "../../../../utils/utils";

@Injectable()
export class KeycloakAuthService extends AuthService {
  static readonly REFRESH_TOKEN_KEY = "REFRESH_TOKEN";

  public accessToken: string;

  private keycloak = new Keycloak("assets/keycloak.json");
  private keycloakReady = this.keycloak.init({});
  private refreshTokenTimeout;

  constructor(private httpClient: HttpClient) {
    super();
  }

  authenticate(username: string, password: string): Promise<DatabaseUser> {
    return this.keycloakReady
      .then(() => this.credentialAuth(username, password))
      .then((token) => this.processToken(token));
  }

  autoLogin(): Promise<DatabaseUser> {
    return this.keycloakReady
      .then(() => this.refreshTokenAuth())
      .then((token) => this.processToken(token));
  }

  private credentialAuth(
    username: string,
    password: string
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
    const options = {
      headers: new HttpHeaders().set(
        "Content-Type",
        "application/x-www-form-urlencoded"
      ),
    };
    return firstValueFrom(
      this.httpClient.post<OIDCTokenResponse>(
        `${this.keycloak.authServerUrl}realms/${this.keycloak.realm}/protocol/openid-connect/token`,
        body.toString(),
        options
      )
    );
  }

  private processToken(token: OIDCTokenResponse): DatabaseUser {
    this.accessToken = token.access_token;
    localStorage.setItem(
      KeycloakAuthService.REFRESH_TOKEN_KEY,
      token.refresh_token
    );
    this.refreshTokenBeforeExpiry(token.expires_in);
    const parsedToken = parseJwt(this.accessToken);
    return {
      name: parsedToken.username,
      roles: parsedToken["_couchdb.roles"],
    };
  }

  private refreshTokenBeforeExpiry(secondsTillExpiration: number) {
    // Refresh token one minute before it expires or after ten seconds
    const refreshTimeout = Math.max(10, secondsTillExpiration - 60);
    this.refreshTokenTimeout = setTimeout(
      () => this.refreshTokenAuth().then((token) => this.processToken(token)),
      refreshTimeout * 1000
    );
  }

  addAuthHeader(headers: HttpHeaders) {
    headers.set("Authorization", "Bearer " + this.accessToken);
  }

  async logout() {
    clearTimeout(this.refreshTokenTimeout);
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
}

export interface OIDCTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  session_state: string;
}
