import { describe, expect, it, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as childProcess from "child_process";

vi.mock("fs");
vi.mock("child_process");

describe("getCredentials", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("DOMAIN", "aam-digital.com");
  });

  it("parses credentials.json and resolves url from name + DOMAIN env", async () => {
    const raw = JSON.stringify([
      { name: "demo", password: "secret" },
      { name: "test", password: "pw2", category: "staging" },
    ]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");
    const result = getCredentials();

    expect(result).toEqual([
      {
        url: "demo.aam-digital.com",
        name: "demo",
        password: "secret",
        username: undefined,
        category: "",
      },
      {
        url: "test.aam-digital.com",
        name: "test",
        password: "pw2",
        username: undefined,
        category: "staging",
      },
    ]);
  });

  it("uses explicit url field when present, ignoring name + DOMAIN", async () => {
    const raw = JSON.stringify([
      { url: "custom.host.example", name: "x", password: "pw" },
    ]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");
    const result = getCredentials();

    expect(result[0].url).toBe("custom.host.example");
  });

  it("trims whitespace from category", async () => {
    const raw = JSON.stringify([
      { name: "org", password: "pw", category: "  prod  " },
    ]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");
    const result = getCredentials();

    expect(result[0].category).toBe("prod");
  });

  it("throws a readable error when no credentials file is found", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { getCredentials } = await import("./credentials");

    expect(() => getCredentials()).toThrow(/No credentials.json/);
  });

  describe("age-encrypted credentials", () => {
    it("decrypts a .age file via age and parses the result", async () => {
      const decrypted = JSON.stringify([{ name: "demo", password: "s3cr3t" }]);
      vi.mocked(childProcess.execFileSync).mockReturnValue(decrypted);

      const { getCredentials } = await import("./credentials");
      const result = getCredentials("/some/where/credentials.json.age");

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "age",
        ["--decrypt", "/some/where/credentials.json.age"],
        expect.objectContaining({ encoding: "utf-8" }),
      );
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(result[0].password).toBe("s3cr3t");
    });

    it("prefers the encrypted file over plaintext when both resolve", async () => {
      // existsSync true => first candidate (credentials.json.age) wins
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(childProcess.execFileSync).mockReturnValue(
        JSON.stringify([{ name: "demo", password: "enc" }]),
      );

      const { getCredentials } = await import("./credentials");
      const result = getCredentials();

      expect(childProcess.execFileSync).toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(result[0].password).toBe("enc");
    });

    it("gives a clear error when age is not installed", async () => {
      const enoent = Object.assign(new Error("spawn age ENOENT"), {
        code: "ENOENT",
      });
      vi.mocked(childProcess.execFileSync).mockImplementation(() => {
        throw enoent;
      });

      const { getCredentials } = await import("./credentials");

      expect(() => getCredentials("/x/credentials.json.age")).toThrow(
        /Install it first/,
      );
    });

    it("reports a decryption failure (wrong passphrase) clearly", async () => {
      vi.mocked(childProcess.execFileSync).mockImplementation(() => {
        throw new Error("exited with code 1");
      });

      const { getCredentials } = await import("./credentials");

      expect(() => getCredentials("/x/credentials.json.age")).toThrow(
        /Failed to decrypt/,
      );
    });
  });
});
