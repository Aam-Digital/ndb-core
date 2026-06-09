export async function getKeycloakToken(): Promise<string> {
  const url = process.env["KEYCLOAK_URL"];
  const password = process.env["KEYCLOAK_ADMIN_PASSWORD"];
  if (!url) throw new Error("KEYCLOAK_URL environment variable is not set");

  const body = new URLSearchParams();
  body.set("username", "admin");
  body.set("password", password ?? "");
  body.set("grant_type", "password");
  body.set("client_id", "admin-cli");

  const res = await fetch(
    `${url}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Keycloak token request failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function getUsersFromKeycloak(
  org: string,
  token: string,
): Promise<unknown[]> {
  const url = process.env["KEYCLOAK_URL"];
  if (!url) throw new Error("KEYCLOAK_URL environment variable is not set");

  const res = await fetch(`${url}/admin/realms/${org}/users?enabled=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Keycloak users request failed for realm "${org}" (${res.status}): ${body}`);
  }
  return res.json() as Promise<unknown[]>;
}
