import { inject, Injectable } from "@angular/core";
import { memoize } from "lodash-es";
import { SessionInfo } from "../session-info";
import { KeycloakEventTypeLegacy, KeycloakService } from "keycloak-angular";
import { Logging } from "../../../logging/logging.service";
import { Entity } from "../../../entity/model/entity";
import { ParsedJWT, parseJwt } from "../../session-utils";
import { RemoteLoginNotAvailableError } from "./remote-login-not-available.error";
import { KeycloakUserDto } from "../../../user/user-admin-service/keycloak-user-dto";
import { ActivatedRoute } from "@angular/router";
import { ThirdPartyAuthenticationService } from "../../../../features/third-party-authentication/third-party-authentication.service";
import { reuseFirstAsync } from "#src/app/utils/reuse-first-async";

/**
 * Handles the remote session with keycloak
 */
@Injectable()
export class KeycloakAuthService {
  static readonly LAST_AUTH_KEY = "LAST_REMOTE_LOGIN";
  accessToken: string;

  private keycloak = inject(KeycloakService);
  private activatedRoute = inject(ActivatedRoute);
  private thirdPartyAuthService = inject(ThirdPartyAuthenticationService);

  /**
   * Check for an existing session or forward to the login page.
   */
  login = reuseFirstAsync(async (): Promise<SessionInfo> => {
    await this.initKeycloak();

    await this.keycloak.updateToken();
    let token = await this.keycloak.getToken();
    if (!token) {
      // Forward to the keycloak login page.
      await this.keycloak.login({
        redirectUri: location.href,
        ...this.thirdPartyAuthService.initSessionParams(this.activatedRoute),
      });
      token = await this.keycloak.getToken();
    }

    return this.processToken(token);
  });

  private initKeycloak = memoize(async () => {
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
        err?.message?.includes(
          "Timeout when waiting for 3rd party check iframe message.",
        )
      ) {
        // this is actually an expected scenario, user's internet is slow or not available
        err = new RemoteLoginNotAvailableError();
      } else {
        Logging.error("Keycloak init failed", err);
      }

      this.initKeycloak.cache.clear();
      throw err;
    }

    // auto-refresh expiring tokens, as suggested by https://github.com/mauriciovigolo/keycloak-angular?tab=readme-ov-file#keycloak-js-events
    this.keycloak.keycloakEvents$.subscribe((event) => {
      if (event.type == KeycloakEventTypeLegacy.OnTokenExpired) {
        this.login().catch((err) =>
          Logging.debug("automatic token refresh failed", err),
        );
      }
    });
  });

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

      // TODO: access from resource_access.app.roles and also resource_access.realm-management.roles === manage-users ?
      roles: parsedToken["_couchdb.roles"],
      email: parsedToken.email,
    };

    if (parsedToken.username) {
      sessionInfo.entityId = parsedToken.username.includes(":")
        ? parsedToken.username
        : // fallback for legacy config: manually add "User" entity prefix
          Entity.createPrefixedId("User", parsedToken.username);
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
