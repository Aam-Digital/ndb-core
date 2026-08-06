import { describe, expect, it, vi } from "vitest";
import {
  applyOrgOverrides,
  knownCategories,
  mergeCredentials,
  parseCredentialsFile,
  type RawCredentialsFile,
} from "./merge";

/** The shape `collect-credentials.sh` produces on the server. */
function serverFile(orgs: { name: string; password: string }[]): string {
  return JSON.stringify(orgs);
}

describe("parseCredentialsFile", () => {
  it("parses the bare-array form the server script produces", () => {
    const result = parseCredentialsFile(
      serverFile([{ name: "demo", password: "pw" }]),
      "server.json",
    );

    expect(result.orgs).toEqual([{ name: "demo", password: "pw" }]);
  });

  it("keeps unknown top-level keys such as keycloak", () => {
    const result = parseCredentialsFile(
      JSON.stringify({
        keycloak: { url: "https://kc.example.com", adminPassword: "kc" },
        orgs: [{ name: "demo", password: "pw" }],
      }),
      "local.json",
    );

    expect(result.keycloak).toEqual({
      url: "https://kc.example.com",
      adminPassword: "kc",
    });
  });

  it("reports the source file on malformed JSON", () => {
    expect(() => parseCredentialsFile("[{ broken", "server.json")).toThrow(
      /Failed to parse credentials from server.json/,
    );
  });

  it("rejects an org without a password instead of merging it", () => {
    expect(() =>
      parseCredentialsFile(JSON.stringify([{ name: "demo" }]), "server.json"),
    ).toThrow(/missing "password"/);
  });

  it("rejects an org that identifies neither by name nor url", () => {
    expect(() =>
      parseCredentialsFile(JSON.stringify([{ password: "pw" }]), "server.json"),
    ).toThrow(/must define either "url" or "name"/);
  });

  it("rejects duplicate orgs, which would make matching ambiguous", () => {
    expect(() =>
      parseCredentialsFile(
        serverFile([
          { name: "demo", password: "a" },
          { name: "c-demo", password: "b" },
        ]),
        "server.json",
      ),
    ).toThrow(/both refer to/);
  });

  it("allows the same name twice when a url tells the entries apart", () => {
    const result = parseCredentialsFile(
      JSON.stringify([
        { name: "alpha", url: "alpha.staging.example", password: "a" },
        { name: "alpha", url: "alpha.example", password: "b" },
      ]),
      "local.json",
    );

    expect(result.orgs).toHaveLength(2);
  });

  it("only warns about duplicates in the operator's own file", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = parseCredentialsFile(
      JSON.stringify([
        { name: "demo", password: "a" },
        { name: "demo", password: "b" },
      ]),
      "local.json",
      { duplicates: "warn" },
    );

    expect(result.orgs).toHaveLength(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("both refer to"));
    warn.mockRestore();
  });
});

describe("mergeCredentials", () => {
  const existing: RawCredentialsFile = {
    keycloak: { url: "https://kc.example.com", adminPassword: "kc" },
    orgs: [
      { name: "demo", password: "old-pw", category: "prod" },
      {
        name: "custom",
        url: "custom.host.example.com",
        username: "superadmin",
        password: "pw2",
        category: "staging",
      },
    ],
  };

  it("updates the password but keeps locally curated fields", () => {
    const result = mergeCredentials(existing, [
      { name: "demo", password: "new-pw" },
    ]);

    expect(result.merged.orgs[0]).toEqual({
      name: "demo",
      password: "new-pw",
      category: "prod",
    });
    expect(result.updated).toEqual(["demo"]);
  });

  it("keeps the keycloak block the server file never contains", () => {
    const result = mergeCredentials(existing, [
      { name: "demo", password: "new-pw" },
    ]);

    expect(result.merged.keycloak).toEqual(existing.keycloak);
  });

  it("keeps a custom url and username when the source only carries a password", () => {
    const result = mergeCredentials(existing, [
      { name: "custom", password: "rotated" },
    ]);

    expect(result.merged.orgs[1]).toEqual({
      name: "custom",
      url: "custom.host.example.com",
      username: "superadmin",
      password: "rotated",
      category: "staging",
    });
  });

  it("appends orgs that are new on the server", () => {
    const result = mergeCredentials(existing, [
      { name: "fresh", password: "pw3" },
    ]);

    expect(result.added).toEqual(["fresh"]);
    expect(result.merged.orgs).toHaveLength(3);
    expect(result.merged.orgs[2]).toEqual({ name: "fresh", password: "pw3" });
  });

  it("matches across the c- instance prefix instead of duplicating the org", () => {
    const prefixed: RawCredentialsFile = {
      orgs: [{ name: "c-demo", password: "old", category: "prod" }],
    };

    const result = mergeCredentials(prefixed, [
      { name: "demo", password: "new" },
    ]);

    expect(result.merged.orgs).toHaveLength(1);
    expect(result.merged.orgs[0]).toEqual({
      name: "c-demo", // the local spelling is kept
      password: "new",
      category: "prod",
    });
    expect(result.updated).toEqual(["c-demo"]);
  });

  it("matches by url when names differ", () => {
    const result = mergeCredentials(existing, [
      { name: "renamed", url: "custom.host.example.com", password: "pw2" },
    ]);

    expect(result.merged.orgs).toHaveLength(2);
    expect(result.unchanged).toEqual(["custom"]);
  });

  it("reports orgs missing from the source but keeps them by default", () => {
    const result = mergeCredentials(existing, [
      { name: "demo", password: "old-pw" },
    ]);

    expect(result.missing).toEqual(["custom"]);
    expect(result.merged.orgs).toHaveLength(2);
    expect(result.pruned).toBe(false);
  });

  it("drops orgs missing from the source with prune", () => {
    const result = mergeCredentials(
      existing,
      [{ name: "demo", password: "old-pw" }],
      { prune: true },
    );

    expect(result.merged.orgs.map((o) => o.name)).toEqual(["demo"]);
    expect(result.pruned).toBe(true);
  });

  it("keeps orgs added in the same run when pruning", () => {
    const result = mergeCredentials(
      existing,
      [
        { name: "demo", password: "old-pw" },
        { name: "fresh", password: "pw3" },
      ],
      { prune: true },
    );

    expect(result.merged.orgs.map((o) => o.name)).toEqual(["demo", "fresh"]);
  });

  it("reports an unchanged org rather than a spurious update", () => {
    const result = mergeCredentials(existing, [
      { name: "demo", password: "old-pw" },
    ]);

    expect(result.unchanged).toEqual(["demo"]);
    expect(result.updated).toEqual([]);
  });

  it("ignores empty incoming values so they cannot wipe local settings", () => {
    const result = mergeCredentials(existing, [
      { name: "demo", password: "old-pw", category: "" },
    ]);

    expect(result.merged.orgs[0].category).toBe("prod");
  });

  it("does not mutate the file it was given", () => {
    const snapshot = JSON.parse(JSON.stringify(existing));

    mergeCredentials(existing, [{ name: "demo", password: "new-pw" }]);

    expect(existing).toEqual(snapshot);
  });

  it("updates exactly one entry when a name occurs twice in the target", () => {
    const duplicated: RawCredentialsFile = {
      orgs: [
        { name: "alpha", url: "alpha.staging.example", password: "a" },
        { name: "alpha", url: "alpha.example", password: "b" },
      ],
    };

    const result = mergeCredentials(duplicated, [
      { name: "alpha", password: "new" },
    ]);

    expect(result.merged.orgs).toHaveLength(2);
    expect(result.updated).toEqual(["alpha"]);
    expect(result.merged.orgs.map((o) => o.password)).toEqual(["new", "b"]);
  });

  it("matches the right entry by name + url when a name occurs twice", () => {
    const duplicated: RawCredentialsFile = {
      orgs: [
        { name: "alpha", url: "alpha.staging.example", password: "a" },
        { name: "alpha", url: "alpha.example", password: "b" },
      ],
    };

    const result = mergeCredentials(duplicated, [
      { name: "alpha", url: "alpha.example", password: "new" },
    ]);

    expect(result.merged.orgs.map((o) => o.password)).toEqual(["a", "new"]);
  });

  it("treats a first run against an empty file as adding everything", () => {
    const result = mergeCredentials({ orgs: [] }, [
      { name: "a", password: "1" },
      { name: "b", password: "2" },
    ]);

    expect(result.added).toEqual(["a", "b"]);
    expect(result.missing).toEqual([]);
  });

  describe("addedIndices", () => {
    it("points at the added orgs within merged.orgs", () => {
      const result = mergeCredentials(existing, [
        { name: "fresh", password: "pw3" },
      ]);

      expect(result.addedIndices).toEqual([2]);
      expect(result.merged.orgs[2].name).toBe("fresh");
    });

    it("still points at them after pruning shifted the array", () => {
      // Both existing orgs are dropped, so naive `existing.orgs.length + i`
      // arithmetic would point past the end of the array.
      const result = mergeCredentials(
        existing,
        [
          { name: "fresh", password: "pw3" },
          { name: "fresher", password: "pw4" },
        ],
        { prune: true },
      );

      expect(result.merged.orgs.map((o) => o.name)).toEqual([
        "fresh",
        "fresher",
      ]);
      expect(
        result.addedIndices.map((index) => result.merged.orgs[index].name),
      ).toEqual(["fresh", "fresher"]);
    });

    it("stays aligned with the added labels", () => {
      const result = mergeCredentials(existing, [
        { name: "demo", password: "old-pw" },
        { name: "one", password: "1" },
        { name: "two", password: "2" },
      ]);

      expect(
        result.addedIndices.map((index) => result.merged.orgs[index].name),
      ).toEqual(result.added);
    });
  });
});

describe("applyOrgOverrides", () => {
  const file: RawCredentialsFile = {
    keycloak: { url: "https://kc.example.com", adminPassword: "kc" },
    orgs: [
      { name: "existing", password: "a", category: "prod" },
      { name: "fresh", password: "b" },
    ],
  };

  it("sets all optional fields only on the given positions", () => {
    const result = applyOrgOverrides(
      file,
      new Map([
        [
          1,
          {
            category: "staging",
            username: "superadmin",
            url: "fresh.example.com",
          },
        ],
      ]),
    );

    expect(result.orgs[0]).toEqual(file.orgs[0]);
    expect(result.orgs[1]).toEqual({
      name: "fresh",
      password: "b",
      category: "staging",
      username: "superadmin",
      url: "fresh.example.com",
    });
  });

  it("leaves untouched orgs alone when no override is given", () => {
    const result = applyOrgOverrides(file, new Map([[1, {}]]));

    expect(result.orgs[1]).toEqual({ name: "fresh", password: "b" });
  });

  // Absent vs. empty string matters per field: "" would be sent as the CouchDB
  // user instead of falling back to admin, and would suppress url resolution.
  it.each(["category", "username", "url"] as const)(
    "leaves %s absent for blank input rather than writing an empty string",
    (field) => {
      const result = applyOrgOverrides(
        file,
        new Map([[1, { [field]: "   " }]]),
      );

      expect(result.orgs[1]).not.toHaveProperty(field);
    },
  );

  it.each([
    ["category", "  staging  ", "staging"],
    ["username", "  superadmin  ", "superadmin"],
    ["url", "  fresh.example.com  ", "fresh.example.com"],
  ] as const)("trims the entered %s", (field, entered, expected) => {
    const result = applyOrgOverrides(
      file,
      new Map([[1, { [field]: entered }]]),
    );

    expect(result.orgs[1][field]).toBe(expected);
  });

  it("does not clear an existing value when the override is blank", () => {
    const result = applyOrgOverrides(file, new Map([[0, { category: "" }]]));

    expect(result.orgs[0].category).toBe("prod");
  });

  it("preserves other top-level keys", () => {
    const result = applyOrgOverrides(file, new Map([[1, { category: "s" }]]));

    expect(result.keycloak).toEqual(file.keycloak);
  });

  it("does not mutate the file it was given", () => {
    const snapshot = JSON.parse(JSON.stringify(file));

    applyOrgOverrides(
      file,
      new Map([[1, { category: "staging", username: "superadmin" }]]),
    );

    expect(file).toEqual(snapshot);
  });
});

describe("knownCategories", () => {
  it("lists distinct categories in use, sorted", () => {
    const categories = knownCategories({
      orgs: [
        { name: "a", password: "1", category: "prod" },
        { name: "b", password: "2", category: "staging" },
        { name: "c", password: "3", category: "prod" },
      ],
    });

    expect(categories).toEqual(["prod", "staging"]);
  });

  it("ignores orgs without a category", () => {
    const categories = knownCategories({
      orgs: [
        { name: "a", password: "1" },
        { name: "b", password: "2", category: "  " },
        { name: "c", password: "3", category: "prod" },
      ],
    });

    expect(categories).toEqual(["prod"]);
  });
});
