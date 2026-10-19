/**
 * Human-readable labels of the client scopes the backend offers for API clients.
 * Scopes not listed here are shown with the description provided by the backend.
 */
const SCOPE_LABELS: Record<string, string> = {
  reporting_read: $localize`:API client scope:Read reports and their results`,
  reporting_write: $localize`:API client scope:Calculate reports and get notified of changes (webhooks)`,
  third_party_authentication: $localize`:API client scope:Sign in users from the external system (single sign-on)`,
};

/** Documentation for the external system's developers, per client scope. */
const SCOPE_DOCUMENTATION: Record<string, string> = {
  reporting_read:
    "https://github.com/Aam-Digital/aam-services/blob/main/docs/modules/reporting.md#api-access-to-reports",
  reporting_write:
    "https://github.com/Aam-Digital/aam-services/blob/main/docs/modules/reporting.md#api-access-to-reports",
  third_party_authentication:
    "https://github.com/Aam-Digital/aam-services/blob/main/docs/modules/third-party-authentication.md#usage",
};

/**
 * The client scope that allows an external system to sign in as any user of the system.
 */
export const SINGLE_SIGN_ON_SCOPE = "third_party_authentication";

export function getScopeLabel(scope: string, description?: string): string {
  return SCOPE_LABELS[scope] ?? description ?? scope;
}

export function getScopeDocumentation(scopes: string[]): string[] {
  return [
    ...new Set(scopes.map((s) => SCOPE_DOCUMENTATION[s]).filter(Boolean)),
  ];
}
