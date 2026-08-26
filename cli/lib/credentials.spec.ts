import { describe, expect, it, vi, beforeEach } from "vitest";
import * as fs from "fs";

vi.mock("fs");

const { mockAddPassphrase, mockDecrypt, mockSetPassphrase, mockEncrypt } =
  vi.hoisted(() => ({
    mockAddPassphrase: vi.fn(),
    mockDecrypt: vi.fn(),
    mockSetPassphrase: vi.fn(),
    mockEncrypt: vi.fn(),
  }));

vi.mock("age-encryption", () => ({
  Decrypter: class {
    addPassphrase = mockAddPassphrase;
    decrypt = mockDecrypt;
  },
  Encrypter: class {
    setPassphrase = mockSetPassphrase;
    encrypt = mockEncrypt;
  },
}));

const { mockAskHidden } = vi.hoisted(() => ({ mockAskHidden: vi.fn() }));

vi.mock("./prompt.js", () => ({
  createPromptSession: () => ({
    ask: vi.fn(),
    askHidden: mockAskHidden,
    close: vi.fn(),
  }),
}));

describe("getCredentials", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
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
    const result = await getCredentials();

    expect(result.orgs).toEqual([
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
    expect(result.keycloak).toBeUndefined();
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
    const result = await getCredentials();

    expect(result.orgs[0].url).toBe("custom.host.example");
  });

  it("throws if an org has neither explicit url nor name", async () => {
    const raw = JSON.stringify([{ password: "pw" }]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");

    await expect(getCredentials()).rejects.toThrow(
      /must define either "url" or "name"/,
    );
  });

  it("throws when DOMAIN is missing and org has no explicit url", async () => {
    vi.stubEnv("DOMAIN", "");
    const raw = JSON.stringify([{ name: "org", password: "pw" }]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");

    await expect(getCredentials()).rejects.toThrow(
      /DOMAIN env var is required/,
    );
  });

  it("does not resolve or validate an unrelated org excluded by an --org filter", async () => {
    // The exact bug this guards against: one legacy org in the file has no
    // explicit url and would need DOMAIN to resolve one — but the operator
    // only asked for a *different* org, so that broken entry must never be
    // touched, let alone abort the whole command.
    vi.stubEnv("DOMAIN", "");
    const raw = JSON.stringify([
      { name: "org-a", password: "pw1" },
      { name: "org-b", password: "pw2", url: "org-b.example.com" },
    ]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");
    const result = await getCredentials(undefined, { org: "org-b" });

    expect(result.orgs).toEqual([
      {
        url: "org-b.example.com",
        name: "org-b",
        password: "pw2",
        username: undefined,
        category: "",
      },
    ]);
  });

  it("still validates and throws for an org that the filter does select", async () => {
    vi.stubEnv("DOMAIN", "");
    const raw = JSON.stringify([{ name: "org-b", password: "pw" }]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");

    await expect(getCredentials(undefined, { org: "org-b" })).rejects.toThrow(
      /DOMAIN env var is required/,
    );
  });

  it("matches a --org filter given as the DOMAIN-derived url against a name-only entry", async () => {
    vi.stubEnv("DOMAIN", "example.com");
    const raw = JSON.stringify([{ name: "foo", password: "pw" }]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");
    const result = await getCredentials(undefined, {
      org: "foo.example.com",
    });

    expect(result.orgs).toEqual([
      {
        url: "foo.example.com",
        name: "foo",
        password: "pw",
        username: undefined,
        category: "",
      },
    ]);
  });

  it("filters by category the same way, before resolving urls", async () => {
    vi.stubEnv("DOMAIN", "");
    const raw = JSON.stringify([
      { name: "broken", password: "pw1", category: "internal" },
      {
        name: "org-b",
        password: "pw2",
        url: "org-b.example.com",
        category: "prod",
      },
    ]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");
    const result = await getCredentials(undefined, { category: "prod" });

    expect(result.orgs).toEqual([
      {
        url: "org-b.example.com",
        name: "org-b",
        password: "pw2",
        username: undefined,
        category: "prod",
      },
    ]);
  });

  it("keeps original file order's index in error messages even when filtered", async () => {
    vi.stubEnv("DOMAIN", "aam-digital.com");
    const raw = JSON.stringify([
      { name: "demo", password: "pw1" },
      { name: "org-b" }, // index 1 — missing password, and matches the filter
    ]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");

    await expect(getCredentials(undefined, { org: "org-b" })).rejects.toThrow(
      /org at index 1 is missing "password"/,
    );
  });

  it("throws when password is missing", async () => {
    const raw = JSON.stringify([{ name: "org" }]);
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");

    await expect(getCredentials()).rejects.toThrow(/missing "password"/);
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
    const result = await getCredentials();

    expect(result.orgs[0].category).toBe("prod");
  });

  it("parses object format with keycloak config and orgs array", async () => {
    const raw = JSON.stringify({
      keycloak: { url: "https://kc.example.com", adminPassword: "kc-secret" },
      orgs: [{ name: "demo", password: "pw" }],
    });
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith("credentials.json"),
    );
    vi.mocked(fs.readFileSync).mockReturnValue(raw);

    const { getCredentials } = await import("./credentials");
    const result = await getCredentials();

    expect(result.keycloak).toEqual({
      url: "https://kc.example.com",
      adminPassword: "kc-secret",
    });
    expect(result.orgs[0].name).toBe("demo");
  });

  it("throws a readable error when no credentials file is found", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { getCredentials } = await import("./credentials");

    await expect(getCredentials()).rejects.toThrow(/No credentials.json/);
  });

  describe("age-encrypted credentials", () => {
    it("decrypts a .age file with a passphrase and parses the result", async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("ciphertext"));
      mockAskHidden.mockResolvedValueOnce("s3cr3t-phrase");
      mockDecrypt.mockResolvedValueOnce(
        JSON.stringify([{ name: "demo", password: "s3cr3t" }]),
      );

      const { getCredentials } = await import("./credentials");
      const result = await getCredentials("/some/where/credentials.json.age");

      expect(mockAskHidden).toHaveBeenCalledWith("Enter passphrase:");
      expect(mockAddPassphrase).toHaveBeenCalledWith("s3cr3t-phrase");
      expect(mockDecrypt).toHaveBeenCalledWith(
        new Uint8Array(Buffer.from("ciphertext")),
        "text",
      );
      expect(result.orgs[0].password).toBe("s3cr3t");
    });

    it("prefers the encrypted file over plaintext when both resolve", async () => {
      // existsSync true => first candidate (credentials.json.age) wins
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("ciphertext"));
      mockAskHidden.mockResolvedValueOnce("s3cr3t-phrase");
      mockDecrypt.mockResolvedValueOnce(
        JSON.stringify([{ name: "demo", password: "enc" }]),
      );

      const { getCredentials } = await import("./credentials");
      const result = await getCredentials();

      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining("credentials.json.age"),
      );
      expect(result.orgs[0].password).toBe("enc");
    });

    it("reports a decryption failure (wrong passphrase) clearly", async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("ciphertext"));
      mockAskHidden.mockResolvedValueOnce("wrong-phrase");
      mockDecrypt.mockRejectedValueOnce(new Error("bad MAC"));

      const { getCredentials } = await import("./credentials");

      await expect(getCredentials("/x/credentials.json.age")).rejects.toThrow(
        /Failed to decrypt/,
      );
    });

    it("rejects a blank/EOF passphrase instead of trying to decrypt with one", async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("ciphertext"));
      mockAskHidden.mockResolvedValueOnce("");

      const { getCredentials } = await import("./credentials");

      await expect(getCredentials("/x/credentials.json.age")).rejects.toThrow(
        /No passphrase entered/,
      );
      expect(mockDecrypt).not.toHaveBeenCalled();
    });

    it("re-prompts when the cached passphrase doesn't fit a later file", async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("ciphertext"));
      mockAskHidden
        .mockResolvedValueOnce("first-phrase")
        .mockResolvedValueOnce("second-phrase");
      mockDecrypt
        .mockResolvedValueOnce(
          JSON.stringify([{ name: "a", password: "pw-a" }]),
        )
        .mockRejectedValueOnce(new Error("bad MAC"))
        .mockResolvedValueOnce(
          JSON.stringify([{ name: "b", password: "pw-b" }]),
        );

      const { getCredentials } = await import("./credentials");
      await getCredentials("/x/a.json.age");
      const result = await getCredentials("/x/b.json.age");

      expect(mockAskHidden).toHaveBeenCalledTimes(2);
      expect(result.orgs[0].password).toBe("pw-b");
    });
  });
});

describe("writeCredentialsContent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("encrypts with a passphrase, so plaintext never touches disk", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockAskHidden
      .mockResolvedValueOnce("s3cret")
      .mockResolvedValueOnce("s3cret");
    mockEncrypt.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));

    const { writeCredentialsContent } = await import("./credentials");
    await writeCredentialsContent("/x/credentials.json.age", '{"orgs":[]}');

    expect(mockSetPassphrase).toHaveBeenCalledWith("s3cret");
    expect(mockEncrypt).toHaveBeenCalledWith('{"orgs":[]}');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/x/credentials.json.age.tmp",
      new Uint8Array([1, 2, 3]),
    );
  });

  it("asks for a new passphrase with confirmation when nothing was decrypted this run", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockAskHidden
      .mockResolvedValueOnce("new-pass")
      .mockResolvedValueOnce("new-pass");
    mockEncrypt.mockResolvedValueOnce(new Uint8Array([1]));

    const { writeCredentialsContent } = await import("./credentials");
    await writeCredentialsContent("/x/credentials.json.age", "{}");

    expect(mockAskHidden).toHaveBeenNthCalledWith(1, "Enter new passphrase:");
    expect(mockAskHidden).toHaveBeenNthCalledWith(2, "Confirm new passphrase:");
  });

  it("throws without writing when the new-passphrase confirmation doesn't match", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockAskHidden.mockResolvedValueOnce("aaa").mockResolvedValueOnce("bbb");

    const { writeCredentialsContent } = await import("./credentials");

    await expect(
      writeCredentialsContent("/x/credentials.json.age", "{}"),
    ).rejects.toThrow(/did not match/);
    expect(fs.renameSync).not.toHaveBeenCalled();
    expect(fs.rmSync).toHaveBeenCalledWith("/x/credentials.json.age.tmp", {
      force: true,
    });
  });

  it("throws without writing on a blank/EOF new passphrase instead of encrypting with an empty one", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    // "" is what askHidden resolves to both for a bare Enter and for
    // exhausted/closed stdin (e.g. Ctrl-D, or a script piping too few lines).
    mockAskHidden.mockResolvedValueOnce("").mockResolvedValueOnce("");

    const { writeCredentialsContent } = await import("./credentials");

    await expect(
      writeCredentialsContent("/x/credentials.json.age", "{}"),
    ).rejects.toThrow(/No passphrase entered/);
    expect(mockEncrypt).not.toHaveBeenCalled();
    expect(fs.renameSync).not.toHaveBeenCalled();
  });

  it("keeps the previous file as .bak and renames the temp file into place", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockAskHidden.mockResolvedValueOnce("pw").mockResolvedValueOnce("pw");
    mockEncrypt.mockResolvedValueOnce(new Uint8Array([1]));

    const { writeCredentialsContent } = await import("./credentials");
    await writeCredentialsContent("/x/credentials.json.age", "{}");

    expect(fs.renameSync).toHaveBeenNthCalledWith(
      1,
      "/x/credentials.json.age",
      "/x/credentials.json.age.bak",
    );
    expect(fs.renameSync).toHaveBeenNthCalledWith(
      2,
      "/x/credentials.json.age.tmp",
      "/x/credentials.json.age",
    );
  });

  it("leaves the existing file untouched when encryption fails", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    mockAskHidden.mockResolvedValueOnce("pw").mockResolvedValueOnce("pw");
    mockEncrypt.mockRejectedValueOnce(new Error("encryption boom"));

    const { writeCredentialsContent } = await import("./credentials");

    await expect(
      writeCredentialsContent("/x/credentials.json.age", "{}"),
    ).rejects.toThrow("encryption boom");
    expect(fs.renameSync).not.toHaveBeenCalled();
    expect(fs.rmSync).toHaveBeenCalledWith("/x/credentials.json.age.tmp", {
      force: true,
    });
  });

  it("writes a plaintext target with owner-only permissions", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { writeCredentialsContent } = await import("./credentials");
    await writeCredentialsContent("/x/credentials.json", "{}");

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/x/credentials.json.tmp",
      "{}",
      expect.objectContaining({ mode: 0o600 }),
    );
    expect(mockEncrypt).not.toHaveBeenCalled();
    // no previous file to preserve, so only the temp file is moved into place
    expect(fs.renameSync).toHaveBeenCalledTimes(1);
  });
});

describe("session passphrase reuse", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("reuses the passphrase from a decrypt for a later re-encryption in the same run, without asking again", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("ciphertext"));
    mockAskHidden.mockResolvedValueOnce("correct horse battery staple");
    mockDecrypt.mockResolvedValueOnce('{"orgs":[]}');
    mockEncrypt.mockResolvedValueOnce(new Uint8Array([9, 9, 9]));

    const { readCredentialsContent, writeCredentialsContent } =
      await import("./credentials");

    await readCredentialsContent("/x/credentials.json.age");
    await writeCredentialsContent("/x/credentials.json.age", '{"orgs":[]}');

    expect(mockAskHidden).toHaveBeenCalledTimes(1);
    expect(mockSetPassphrase).toHaveBeenCalledWith(
      "correct horse battery staple",
    );
  });

  it("rotates the passphrase when forceNewPassphrase is set, even with a cached one", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("ciphertext"));
    mockAskHidden
      .mockResolvedValueOnce("old-pass") // decrypt
      .mockResolvedValueOnce("new-pass") // encrypt: new
      .mockResolvedValueOnce("new-pass"); // encrypt: confirm
    mockDecrypt.mockResolvedValueOnce("{}");
    mockEncrypt.mockResolvedValueOnce(new Uint8Array([1]));

    const { readCredentialsContent, writeCredentialsContent } =
      await import("./credentials");

    await readCredentialsContent("/x/credentials.json.age");
    await writeCredentialsContent("/x/credentials.json.age", "{}", {
      forceNewPassphrase: true,
    });

    expect(mockAskHidden).toHaveBeenCalledTimes(3);
    expect(mockSetPassphrase).toHaveBeenCalledWith("new-pass");
  });
});
