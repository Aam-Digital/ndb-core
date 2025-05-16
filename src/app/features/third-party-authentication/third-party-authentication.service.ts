import { inject, Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { map } from "rxjs/operators";

/**
 * Interaction with the third-party-authentication API Module.
 * see https://github.com/Aam-Digital/aam-services/blob/main/docs/modules/third-party-authentication.md
 */
@Injectable({
  providedIn: "root",
})
export class ThirdPartyAuthenticationService {
  private readonly LOCAL_STORAGE_KEY = "tpa_session";
  private readonly API_URL =
    environment.API_PROXY_PREFIX + "/v1/third-party-authentication";

  private readonly httpClient = inject(HttpClient);

  /**
   * Check for query parameters from the third-party-authentication
   * to pass them on to the Keycloak login request, if available.
   *
   * @returns An object with queryParams to append to the Keycloak login request
   *          If no session is detected, this is an empty object to not have any effects.
   */
  initSessionParams(
    activatedRoute: ActivatedRoute,
  ): { idpHint: string; loginHint: string } | {} {
    const tpaSessionParam = activatedRoute.snapshot.queryParams["tpa_session"];

    if (tpaSessionParam) {
      const sessionId = tpaSessionParam.split(":")[0];
      this.storeSessionId(sessionId);

      let idpHint = "tpa_session:" + tpaSessionParam;
      return { idpHint, loginHint: idpHint };
    } else {
      this.storeSessionId(null);
      return {};
    }
  }

  private storeSessionId(sessionId: string | null) {
    if (sessionId) {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, sessionId);
    } else {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    }
  }

  getSessionId(): string | null {
    return localStorage.getItem(this.LOCAL_STORAGE_KEY);
  }

  async getRedirectUrl(): Promise<string | undefined> {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      return;
    }

    return firstValueFrom(
      this.httpClient
        .get<UserSessionRedirectDto>(
          `${this.API_URL}/session/${sessionId}/redirect`,
        )
        .pipe(map((res) => res.redirectUrl)),
    );
  }
}

/**
 * Response from API for the redirect URL.
 *
 * see https://github.com/Aam-Digital/aam-services/blob/main/docs/api-specs/third-party-authentication-api-v1.yaml
 */
interface UserSessionRedirectDto {
  redirectUrl: string;
}
