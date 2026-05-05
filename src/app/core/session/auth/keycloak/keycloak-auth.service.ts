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
import { defer, firstValueFrom, throwError, timer, TimeoutError } from "rxjs";
import { retry, timeout } from "rxjs/operators";

/**
 * Hard upper bound on individual Keycloak network operations
 * (init, token refresh). Picked well above expected RTT but short enough
 * that a hung proxy/upstream surfaces a clear failure to the user.
 */
const KEYCLOAK_OPERATION_TIMEOUT_MS = 15_000;

/** Backoff schedule for explicit user-initiated login retries. */
const LOGIN_RETRY_DELAYS_MS = [1_000, 3_000];

/**
 * Backoff schedule for *background* token refreshes (OnTokenExpired).
 * Kept short — if the background refresh keeps failing, the next API
 * call's 401 will trigger an explicit login, so there is no point
 * retrying for many seconds and stalling the user's request.
 */
const TOKEN_REFRESH_RETRY_DELAYS_MS = [2_000, 5_000];

/**
 * Minimum remaining lifetime (in seconds) requested when refreshing the
 * token in the background. Matches keycloak-js's `updateToken(minValidity)`
 * argument.
 */
const TOKEN_MIN_VALIDITY_SECONDS = 30;

/**
 * Browser/keycloak-js error messages that indicate a transient network
 * failure rather than a real authentication problem. Matched against both
 * `err.message` and `err.toString()` since some thrown values (e.g. plain
 * strings from keycloak-js) only expose the text via `toString()`.
 */
const NETWORK_ERROR_PATTERNS = [
  "Failed to fetch",
  "NetworkError",
  "Load failed",
  "Network request failed",
  "Timeout when waiting for 3rd party check iframe message.",
];

function isRetryableNetworkError(err: any): boolean {
  if (!err) return false;
  if (err instanceof TimeoutError) return true;
  if (["AbortError", "TimeoutError"].includes(err?.name)) return true;
  if ([502, 503, 504].includes(err?.status)) return true;
  const message = `${err?.message ?? ""} ${err?.toString?.() ?? ""}`;
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

/**
 * Handles the remote session with keycloak
 */
@Injectable()
export class KeycloakAuthService {
  static readonly LAST_AUTH_KEY = "LAST_REMOTE_LOGIN";
  accessToken?: string;

  private keycloak = inject(KeycloakService);
  private activatedRoute = inject(ActivatedRoute);
  private thirdPartyAuthService = inject(ThirdPartyAuthenticationService);

  /**
   * Check for an existing SSO session without redirecting to Keycloak.
   * Returns the session info if already authenticated, or null if not.
   *
   * Intentionally does NOT retry on transient errors: this runs silently on
   * page load and the user is already waiting on the spinner. Failing fast
   * lets the login form render quickly; a retry happens implicitly when the
   * user clicks "Log in".
   */
  checkSession = reuseFirstAsync(async (): Promise<SessionInfo | null> => {
    await this.initKeycloak();

    try {
      await firstValueFrom(
        defer(() => this.keycloak.updateToken()).pipe(
          timeout({ each: KEYCLOAK_OPERATION_TIMEOUT_MS }),
        ),
      );
    } catch (err) {
      if (this.isOfflineOrUnavailableError(err)) {
        Logging.debug("Keycloak updateToken failed (offline/unavailable)", err);
        throw new RemoteLoginNotAvailableError(err);
      }
      throw err;
    }
    const token = await this.keycloak.getToken();
    if (!token) {
      return null;
    }

    return this.processToken(token);
  });

  /**
   * Check for an existing session or forward to the keycloak login page.
   * Retries on transient network errors (5xx / timeout / abort) since this
   * is invoked by an explicit user action and a single transient failure
   * shouldn't push the user back to the offline fallback.
   */
  login = reuseFirstAsync(
    async (): Promise<SessionInfo> =>
      firstValueFrom(
        defer(() => this.loginOnce()).pipe(
          retry({
            count: LOGIN_RETRY_DELAYS_MS.length,
            delay: (err, retryCount) => {
              const retryable =
                isRetryableNetworkError(err) ||
                (err instanceof RemoteLoginNotAvailableError &&
                  isRetryableNetworkError(err.cause));
              if (!retryable) return throwError(() => err);
              const delayMs =
                LOGIN_RETRY_DELAYS_MS[retryCount - 1] ??
                LOGIN_RETRY_DELAYS_MS[LOGIN_RETRY_DELAYS_MS.length - 1];
              Logging.debug(
                `Keycloak login attempt ${retryCount} failed; retrying in ${delayMs}ms`,
                err,
              );
              return timer(delayMs);
            },
            resetOnSuccess: true,
          }),
        ),
      ),
  );

  private async loginOnce(): Promise<SessionInfo> {
    const existing = await this.checkSession();
    if (existing) {
      return existing;
    }

    // Forward to the keycloak login page.
    await this.keycloak.login({
      redirectUri: location.href,
      ...this.thirdPartyAuthService.initSessionParams(this.activatedRoute),
    });
    const token = await this.keycloak.getToken();

    return this.processToken(token);
  }

  private initKeycloak = memoize(async () => {
    try {
      await firstValueFrom(
        defer(() =>
          this.keycloak.init({
            config: window.location.origin + "/assets/keycloak.json",
            initOptions: {
              onLoad: "check-sso",
              silentCheckSsoRedirectUri:
                window.location.origin + "/assets/silent-check-sso.html",
            },
            // GitHub API rejects if non GitHub bearer token is present
            shouldAddToken: ({ url }) => !url.includes("api.github.com"),
          }),
        ).pipe(timeout({ each: KEYCLOAK_OPERATION_TIMEOUT_MS })),
      );
    } catch (err) {
      if (this.isOfflineOrUnavailableError(err)) {
        Logging.debug("Keycloak init failed (offline/unavailable)", err);
        err = new RemoteLoginNotAvailableError(err);
      } else {
        Logging.error("Keycloak init failed", err);
      }

      this.initKeycloak.cache.clear();
      throw err;
    }

    // Silently refresh expiring tokens in the background. We deliberately
    // do NOT fall back to a full keycloak.login() redirect here: that would
    // yank the user out of whatever they were doing the moment a transient
    // 504 from the proxy disrupted a refresh. If the silent refresh keeps
    // failing, the next authenticated request will hit a 401 and the
    // existing 401-retry path will then explicitly call login().
    this.keycloak.keycloakEvents$.subscribe((event) => {
      if (event.type == KeycloakEventTypeLegacy.OnTokenExpired) {
        this.refreshKeycloakToken()
          .then(() => this.cacheCurrentToken())
          .catch((err) =>
            Logging.debug(
              "automatic token refresh failed; will re-auth on next 401",
              err,
            ),
          );
      }
    });
  });

  /**
   * Silently refresh the Keycloak access token if it expires within
   * {@link TOKEN_MIN_VALIDITY_SECONDS}. Bounded by the same per-operation
   * timeout as init/login and retried on transient network errors so a
   * single 504 from the proxy doesn't disrupt an active session.
   */
  private refreshKeycloakToken(): Promise<boolean> {
    return firstValueFrom(
      defer(() => this.keycloak.updateToken(TOKEN_MIN_VALIDITY_SECONDS)).pipe(
        timeout({ each: KEYCLOAK_OPERATION_TIMEOUT_MS }),
        retry({
          count: TOKEN_REFRESH_RETRY_DELAYS_MS.length,
          delay: (err, retryCount) => {
            if (!isRetryableNetworkError(err)) return throwError(() => err);
            const delayMs =
              TOKEN_REFRESH_RETRY_DELAYS_MS[retryCount - 1] ??
              TOKEN_REFRESH_RETRY_DELAYS_MS[
                TOKEN_REFRESH_RETRY_DELAYS_MS.length - 1
              ];
            Logging.debug(
              `Token refresh attempt ${retryCount} failed; retrying in ${delayMs}ms`,
              err,
            );
            return timer(delayMs);
          },
          resetOnSuccess: true,
        }),
      ),
    );
  }

  private async cacheCurrentToken(): Promise<void> {
    const token = await this.keycloak.getToken();
    if (token) {
      this.accessToken = token;
    }
  }

  private isOfflineOrUnavailableError(err: any): boolean {
    // All retryable network errors (5xx / timeout / abort / fetch failures)
    // also count as "unavailable" so they map to RemoteLoginNotAvailableError
    // instead of spamming Sentry.
    if (isRetryableNetworkError(err)) {
      return true;
    }
    return !navigator.onLine;
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
   * Clear the memoised Keycloak init so the next call re-runs initKeycloak.
   * Required after logout (Keycloak SPA state is otherwise stuck on the
   * previous session) and during recovery from a stuck init.
   */
  resetKeycloakInit(): void {
    this.initKeycloak.cache.clear();
  }

  /**
   * Forward to the keycloak logout endpoint to clear the session.
   */
  async logout() {
    this.resetKeycloakInit();
    this.accessToken = undefined;
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
