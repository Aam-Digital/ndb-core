import type { KeycloakConfig } from "./credentials.js";

const KEYCLOAK_FETCH_TIMEOUT_MS = 15_000;

function createTimeoutSignal(): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(KEYCLOAK_FETCH_TIMEOUT_MS);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), KEYCLOAK_FETCH_TIMEOUT_MS);
  return controller.signal;
}

export async function getKeycloakToken(
  config?: KeycloakConfig,
): Promise<string> {
  const url = config?.url ?? process.env["KEYCLOAK_URL"];
  const password =
    config?.adminPassword ?? process.env["KEYCLOAK_ADMIN_PASSWORD"];
  if (!url)
    throw new Error(
      "Keycloak URL not configured (set keycloak.url in credentials.json or KEYCLOAK_URL env)",
    );
  if (!password) {
    throw new Error(
      "Keycloak admin password not configured (set keycloak.adminPassword in credentials.json or KEYCLOAK_ADMIN_PASSWORD env)",
    );
  }

  const params = new URLSearchParams();
  params.set("username", "admin");
  params.set("password", password);
  params.set("grant_type", "password");
  params.set("client_id", "admin-cli");

  const res = await fetch(
    `${url}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: createTimeoutSignal(),
    },
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `Keycloak token request failed (${res.status}): ${errBody}`,
    );
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function getUsersFromKeycloak(
  org: string,
  token: string,
  config?: KeycloakConfig,
): Promise<unknown[]> {
  const url = config?.url ?? process.env["KEYCLOAK_URL"];
  if (!url)
    throw new Error(
      "Keycloak URL not configured (set keycloak.url in credentials.json or KEYCLOAK_URL env)",
    );

  const res = await fetch(`${url}/admin/realms/${org}/users?enabled=true`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: createTimeoutSignal(),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `Keycloak users request failed for realm "${org}" (${res.status}): ${errBody}`,
    );
  }
  return res.json() as Promise<unknown[]>;
}
