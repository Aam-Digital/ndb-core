import { computed, inject, Injectable, resource } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "#src/environments/environment";
import { Logging } from "#src/app/core/logging/logging.service";
import { getScopeDocumentation } from "./api-client-scopes";

/**
 * A Keycloak client that an external system uses to access the API (client credentials flow).
 */
export interface ApiClient {
  clientId: string;
  /** label given by the user who created it, e.g. the name of the external system */
  name: string;
  /** the client scopes the client has, i.e. the API access it has */
  scopes: string[];
  createdBy?: string;
  /** ISO-8601 timestamp */
  createdAt?: string;
}

/**
 * A client scope that can be given to an API client.
 */
export interface ApiClientScope {
  name: string;
  description: string;
}

/**
 * The credentials of an API client. The secret is only available right after creating
 * the client or regenerating its secret.
 */
export interface ApiClientCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * What an external system needs, together with the {@link ApiClientCredentials}, to access the API.
 */
export interface ApiConnectionDetails {
  /** the base URL of the API (endpoints like `/v1/reporting/report` are relative to this) */
  apiBaseUrl: string;
  /** the OAuth2 token endpoint for the client credentials flow */
  tokenUrl: string;
}

/**
 * Self-service management of API clients, through the api-client module of the aam-services backend.
 * see https://github.com/Aam-Digital/aam-services/blob/main/docs/api-specs/api-client-api-v1.yaml
 */
@Injectable({
  providedIn: "root",
})
export class ApiClientService {
  private readonly http = inject(HttpClient);

  private readonly API_URL = environment.API_PROXY_PREFIX + "/v1/api-client";

  private readonly featureFlagsResource = resource({
    loader: async () => {
      try {
        return await firstValueFrom(
          this.http.get<Record<string, { enabled: boolean }>>(
            environment.API_PROXY_PREFIX + "/actuator/features",
          ),
        );
      } catch (err) {
        // without the backend (usually a 504) the feature is just not available
        Logging.debug("API client management not available", err);
        return {};
      }
    },
  });

  /**
   * Whether it is still being checked if the backend can manage API clients ({@link isAvailable}).
   */
  readonly isCheckingAvailability = this.featureFlagsResource.isLoading;

  /**
   * Whether the backend of this system can manage API clients.
   */
  readonly isAvailable = computed(
    () => this.featureFlagsResource.value()?.["api-client"]?.enabled ?? false,
  );

  getApiClients(): Promise<ApiClient[]> {
    return firstValueFrom(this.http.get<ApiClient[]>(this.API_URL));
  }

  getScopes(): Promise<ApiClientScope[]> {
    return firstValueFrom(
      this.http.get<ApiClientScope[]>(this.API_URL + "/scope"),
    );
  }

  createApiClient(
    name: string,
    scopes: string[],
  ): Promise<ApiClientCredentials> {
    return firstValueFrom(
      this.http.post<ApiClientCredentials>(this.API_URL, { name, scopes }),
    );
  }

  /**
   * Replace the secret of the API client. The previous secret stops working immediately.
   */
  regenerateSecret(clientId: string): Promise<ApiClientCredentials> {
    return firstValueFrom(
      this.http.post<ApiClientCredentials>(
        `${this.API_URL}/${encodeURIComponent(clientId)}/secret`,
        null,
      ),
    );
  }

  async deleteApiClient(clientId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.API_URL}/${encodeURIComponent(clientId)}`),
    );
  }

  getConnectionDetails(): ApiConnectionDetails {
    const keycloakUrl = (environment.userAdminApi ?? "").replace(/\/+$/, "");
    return {
      apiBaseUrl: window.location.origin + environment.API_PROXY_PREFIX,
      tokenUrl: `${keycloakUrl}/realms/${environment.realm}/protocol/openid-connect/token`,
    };
  }

  /**
   * Everything the developers of the external system need to set up the integration, as one text to pass on.
   */
  formatForSharing(
    credentials: ApiClientCredentials,
    scopes: string[],
  ): string {
    const connection = this.getConnectionDetails();
    return [
      $localize`Aam Digital API access`,
      $localize`API base URL: ${connection.apiBaseUrl}`,
      $localize`Token URL (OAuth2 client credentials): ${connection.tokenUrl}`,
      $localize`Client ID: ${credentials.clientId}`,
      $localize`Client secret: ${credentials.clientSecret}`,
      $localize`Client scopes: ${scopes.join(" ")}`,
      ...getScopeDocumentation(scopes).map(
        (url) => $localize`Documentation: ${url}`,
      ),
    ].join("\n");
  }
}

/**
 * The message for the user of a failed request to the api-client module of the backend.
 */
export function errorMessageOf(err: unknown): string {
  if (err instanceof HttpErrorResponse && err.status === 0) {
    return $localize`Could not connect to the server. Please check your network connection and try again.`;
  }
  const backendMessage =
    err instanceof HttpErrorResponse ? err.error?.errorMessage : undefined;
  return backendMessage
    ? $localize`Something went wrong: ${backendMessage}`
    : $localize`Something went wrong. Please try again later or contact support.`;
}
