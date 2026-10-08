import { describe, expect, it } from "vitest";
import { removeMatchingOrgs } from "./check";
import type { RawCredentialsFile } from "../credentials/merge";

describe("removeMatchingOrgs", () => {
  const file: RawCredentialsFile = {
    keycloak: { url: "https://keycloak.example.com", adminPassword: "x" },
    orgs: [
      { name: "foo", password: "pw1", category: "test" },
      {
        url: "https://explicit.example.com",
        password: "pw2",
        category: "test",
      },
      { name: "bar", password: "pw3", category: "test" },
    ],
  };

  it("removes orgs matched by name-derived url and keeps the rest", () => {
    const { kept, removedCount } = removeMatchingOrgs(
      file,
      new Set(["foo.example.com"]),
      "example.com",
    );

    expect(removedCount).toBe(1);
    expect(kept.map((o) => o.name ?? o.url)).toEqual([
      "https://explicit.example.com",
      "bar",
    ]);
  });

  it("removes orgs matched by explicit url", () => {
    const { kept, removedCount } = removeMatchingOrgs(
      file,
      new Set(["https://explicit.example.com"]),
      "example.com",
    );

    expect(removedCount).toBe(1);
    expect(kept.map((o) => o.name ?? o.url)).toEqual(["foo", "bar"]);
  });

  it("preserves other top-level fields like keycloak", () => {
    const { kept } = removeMatchingOrgs(
      file,
      new Set(["foo.example.com"]),
      "example.com",
    );

    expect(kept.length).toBe(2);
    expect(file.keycloak).toEqual({
      url: "https://keycloak.example.com",
      adminPassword: "x",
    });
  });

  it("is a no-op when no url matches", () => {
    const { kept, removedCount } = removeMatchingOrgs(
      file,
      new Set(["nope.example.com"]),
      "example.com",
    );

    expect(removedCount).toBe(0);
    expect(kept).toHaveLength(file.orgs.length);
  });

  it("cannot derive a url for a name-only entry without DOMAIN", () => {
    const { removedCount } = removeMatchingOrgs(
      file,
      new Set(["foo.example.com"]),
      "",
    );

    expect(removedCount).toBe(0);
  });
});
