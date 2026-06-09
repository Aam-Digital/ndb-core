import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}

describe("KeycloakClient", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("KEYCLOAK_URL", "https://auth.example.com");
    vi.stubEnv("KEYCLOAK_ADMIN_PASSWORD", "secret");
  });

  it("getKeycloakToken sends correct form body and returns access_token", async () => {
    const { getKeycloakToken } = await import("./keycloak-client");
    mockFetch.mockResolvedValueOnce(
      makeJsonResponse({ access_token: "tok123" }),
    );

    const token = await getKeycloakToken();

    expect(token).toBe("tok123");
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://auth.example.com/realms/master/protocol/openid-connect/token",
    );
    const params = new URLSearchParams(opts.body as string);
    expect(params.get("grant_type")).toBe("password");
    expect(params.get("client_id")).toBe("admin-cli");
    expect(params.get("username")).toBe("admin");
    expect(params.get("password")).toBe("secret");
  });

  it("getUsersFromKeycloak fetches enabled users for org and returns array", async () => {
    const { getUsersFromKeycloak } = await import("./keycloak-client");
    const users = [{ id: "u1" }, { id: "u2" }];
    mockFetch.mockResolvedValueOnce(makeJsonResponse(users));

    const result = await getUsersFromKeycloak("demo", "tok123");

    expect(result).toEqual(users);
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/admin/realms/demo/users");
    expect(url).toContain("enabled=true");
    expect((opts.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer tok123",
    );
  });

  it("throws with readable message when KEYCLOAK_URL is not set", async () => {
    vi.stubEnv("KEYCLOAK_URL", "");
    const { getKeycloakToken } = await import("./keycloak-client");

    await expect(getKeycloakToken()).rejects.toThrow(/Keycloak URL not configured/);
  });
});
