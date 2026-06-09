import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface SystemCredentials {
  url: string;
  name?: string;
  password: string;
  username?: string;
  category: string;
}

export interface KeycloakConfig {
  url: string;
  adminPassword: string;
}

export interface CredentialsFile {
  orgs: SystemCredentials[];
  keycloak?: KeycloakConfig;
}

type RawCredential = {
  url?: string;
  name?: string;
  password: string;
  username?: string;
  category?: string;
};

/** Files with this suffix are decrypted on the fly with `age` (passphrase-based). */
const ENCRYPTED_SUFFIX = ".age";

export function getCredentials(credentialsPath?: string): CredentialsFile {
  const path = credentialsPath ?? resolveCredentialsPath();
  const content = path.endsWith(ENCRYPTED_SUFFIX)
    ? decryptWithAge(path)
    : readFileSync(path, "utf-8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e: unknown) {
    throw new Error(
      `Failed to parse credentials from ${path}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  const rawOrgs: RawCredential[] = Array.isArray(parsed)
    ? parsed
    : ((parsed as { orgs?: RawCredential[] }).orgs ?? []);
  const keycloak: KeycloakConfig | undefined = Array.isArray(parsed)
    ? undefined
    : (parsed as { keycloak?: KeycloakConfig }).keycloak;

  const domain = process.env["DOMAIN"] ?? "";
  const orgs = rawOrgs.map((c) => ({
    url: c.url ?? `${c.name}.${domain}`,
    name: c.name,
    password: c.password,
    username: c.username,
    category: c.category?.trim() ?? "",
  }));

  return { orgs, keycloak };
}

/**
 * Decrypt an age-encrypted credentials file into memory (never to disk).
 * `age` prompts for the passphrase on the terminal; only the decrypted
 * JSON is captured from stdout.
 */
function decryptWithAge(path: string): string {
  try {
    return execFileSync("age", ["--decrypt", path], {
      encoding: "utf-8",
      // stdout is captured (the plaintext); stdin/stderr stay attached to the
      // terminal so age can show its passphrase prompt.
      stdio: ["inherit", "pipe", "inherit"],
    });
  } catch (e: unknown) {
    if (e instanceof Error && (e as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Could not run 'age' to decrypt ${path}. Install it first ` +
          `(e.g. 'sudo apt install age' or 'brew install age'). See cli/README.md.`,
      );
    }
    throw new Error(
      `Failed to decrypt ${path} with age (wrong passphrase or corrupt file?).`,
    );
  }
}

function resolveCredentialsPath(): string {
  // Checked in order, first match wins. The default location is `cli/`; the
  // repo root is kept for back-compat; `~/.config/ndb-cli/` is an opt-in
  // out-of-repo location that cannot be committed by accident. Within each
  // location the encrypted file is preferred so secrets are never read from
  // plaintext when an operator has set up age.
  const candidates = [
    join(process.cwd(), "cli", "credentials.json.age"),
    join(process.cwd(), "cli", "credentials.json"),
    join(process.cwd(), "credentials.json.age"),
    join(process.cwd(), "credentials.json"),
    join(homedir(), ".config", "ndb-cli", "credentials.json.age"),
    join(homedir(), ".config", "ndb-cli", "credentials.json"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    "No credentials.json (or credentials.json.age) found. Looked in:\n" +
      candidates.join("\n"),
  );
}
