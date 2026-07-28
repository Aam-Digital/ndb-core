import { execFileSync } from "child_process";
import {
  existsSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "fs";
import { homedir } from "os";
import { join, resolve } from "path";
import { Decrypter, Encrypter } from "age-encryption";
import { createPromptSession, type PromptSession } from "./prompt.js";

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

/** Files with this suffix are decrypted on the fly with a passphrase (age format). */
const ENCRYPTED_SUFFIX = ".age";

/** Suffix of the copy kept when a credentials file is overwritten. */
const BACKUP_SUFFIX = ".bak";

/**
 * The passphrase entered for the first `.age` file this process reads or
 * writes, reused for every later `.age` operation in the same run. Without
 * this, `credentials merge` would ask for a passphrase to decrypt the target
 * and then ask again — for a *different* one — to write it back.
 */
let sessionPassphrase: string | undefined;

export async function getCredentials(
  credentialsPath?: string,
): Promise<CredentialsFile> {
  const path = credentialsPath ?? resolveCredentialsPath();
  const content = await readCredentialsContent(path);

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
  const orgs = rawOrgs.map((c, index) => {
    if (!c.password) {
      throw new Error(
        `Invalid credentials: org at index ${index} is missing "password".`,
      );
    }

    const explicitUrl = c.url?.trim();
    const name = c.name?.trim();

    if (explicitUrl) {
      return {
        url: explicitUrl,
        name,
        password: c.password,
        username: c.username,
        category: c.category?.trim() ?? "",
      };
    }

    if (!name) {
      throw new Error(
        `Invalid credentials: org at index ${index} must define either "url" or "name".`,
      );
    }
    if (!domain) {
      throw new Error(
        `Invalid credentials: DOMAIN env var is required when org "${name}" has no explicit "url".`,
      );
    }

    return {
      url: `${name}.${domain}`,
      name,
      password: c.password,
      username: c.username,
      category: c.category?.trim() ?? "",
    };
  });

  return { orgs, keycloak };
}

/**
 * Read a credentials file as raw JSON text, transparently decrypting `.age`
 * files. Unlike {@link getCredentials} this does no normalisation, so the
 * result can be edited and written back without baking in resolved urls or
 * dropping unknown fields.
 */
export async function readCredentialsContent(path: string): Promise<string> {
  return path.endsWith(ENCRYPTED_SUFFIX)
    ? decryptWithPassphrase(path)
    : readFileSync(path, "utf-8");
}

/**
 * Write raw credentials JSON back to `path`, encrypting with a passphrase
 * when the path ends in `.age`. The plaintext is only ever held in memory, so
 * it never touches the disk.
 *
 * By default this reuses {@link sessionPassphrase} — the passphrase this
 * process already used to decrypt or encrypt a `.age` file — so a `merge`
 * that reads the target and writes it back only asks once. Pass
 * `forceNewPassphrase` to rotate it instead, which still asks (with
 * confirmation) exactly once.
 *
 * The new content goes to a temp file that is only renamed into place once
 * encryption succeeded, and the previous file is kept as `<path>.bak` — a
 * failed or interrupted write must not cost the only copy of the secrets.
 */
export async function writeCredentialsContent(
  path: string,
  content: string,
  options: { forceNewPassphrase?: boolean } = {},
): Promise<void> {
  const tmpPath = `${path}.tmp`;
  try {
    if (path.endsWith(ENCRYPTED_SUFFIX)) {
      await encryptWithPassphrase(content, tmpPath, options);
    } else {
      writeFileSync(tmpPath, content, { encoding: "utf-8", mode: 0o600 });
    }
  } catch (e: unknown) {
    rmSync(tmpPath, { force: true });
    throw e;
  }

  if (existsSync(path)) {
    renameSync(path, `${path}${BACKUP_SUFFIX}`);
  }
  renameSync(tmpPath, path);
}

/** Path of the backup {@link writeCredentialsContent} leaves behind. */
export function backupPathFor(path: string): string {
  return `${path}${BACKUP_SUFFIX}`;
}

/**
 * Whether two paths point at the same file, resolving symlinks where possible.
 * `realpathSync` throws for a path that does not exist yet (a legitimate case
 * for a merge target on first run), so fall back to plain path resolution.
 */
export function isSameFile(a: string, b: string): boolean {
  return canonicalPath(a) === canonicalPath(b);
}

function canonicalPath(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

/**
 * Delete a plaintext secrets file, overwriting it first where the platform
 * offers a tool for it. Falls back to a plain unlink so the file is gone either
 * way. Returns whether the file is actually gone, so callers do not report a
 * deletion that did not happen.
 */
export function secureDelete(path: string): boolean {
  const overwriteCommands: [string, string[]][] = [
    ["shred", ["--remove", path]],
    ["rm", ["-P", path]], // macOS
  ];
  for (const [command, args] of overwriteCommands) {
    try {
      execFileSync(command, args, { stdio: "ignore" });
      return !existsSync(path);
    } catch {
      // try the next one
    }
  }
  try {
    rmSync(path, { force: true });
  } catch {
    return false;
  }
  return !existsSync(path);
}

/**
 * Decrypt an age-passphrase-encrypted credentials file into memory (never to
 * disk). Reuses {@link sessionPassphrase} when this run already has one —
 * e.g. a `.age` merge target read after the source file was already asked
 * about — and caches whatever passphrase actually worked for later writes.
 */
async function decryptWithPassphrase(path: string): Promise<string> {
  const data = readFileSync(path);
  const passphrase =
    sessionPassphrase ?? (await askPassphrase("Enter passphrase:"));

  const decrypter = new Decrypter();
  decrypter.addPassphrase(passphrase);
  let plaintext: string;
  try {
    plaintext = await decrypter.decrypt(data, "text");
  } catch {
    throw new Error(
      `Failed to decrypt ${path} (wrong passphrase or corrupt file?).`,
    );
  }
  sessionPassphrase = passphrase;
  return plaintext;
}

/**
 * Encrypt `content` to `outPath` with a passphrase, reusing
 * {@link sessionPassphrase} by default (see {@link writeCredentialsContent}).
 * With no cached passphrase — nothing was decrypted this run, e.g. a
 * first-time `credentials merge` creating a brand new `.age` file — or with
 * `forceNewPassphrase`, a fresh one is requested with confirmation.
 */
async function encryptWithPassphrase(
  content: string,
  outPath: string,
  options: { forceNewPassphrase?: boolean } = {},
): Promise<void> {
  const passphrase =
    !options.forceNewPassphrase && sessionPassphrase
      ? sessionPassphrase
      : await askNewPassphrase();

  const encrypter = new Encrypter();
  encrypter.setPassphrase(passphrase);
  const encrypted = await encrypter.encrypt(content);
  writeFileSync(outPath, encrypted);
  sessionPassphrase = passphrase;
}

/**
 * A prompt session supplied by the caller (e.g. `credentials merge`, which
 * already has one open for its category/confirm questions), used instead of
 * an ad hoc one when set. Two separate readline interfaces racing for the
 * same piped or pasted stdin can each drain more of it than they consume —
 * one line typed ahead for a *different* prompt then vanishes instead of
 * answering it — so every prompt in one command run has to share a session.
 * See {@link setPassphrasePromptSession}.
 */
let externalPromptSession: PromptSession | undefined;

/**
 * Route this module's passphrase prompts through `session` instead of a
 * throwaway one per call. Pass `undefined` to go back to the default. The
 * caller keeps owning `session` — this module never closes it.
 */
export function setPassphrasePromptSession(
  session: PromptSession | undefined,
): void {
  externalPromptSession = session;
}

async function withPromptSession<T>(
  fn: (session: PromptSession) => Promise<T>,
): Promise<T> {
  if (externalPromptSession) return fn(externalPromptSession);
  const session = createPromptSession();
  try {
    return await fn(session);
  } finally {
    session.close();
  }
}

async function askPassphrase(question: string): Promise<string> {
  const passphrase = await withPromptSession((session) =>
    session.askHidden(question),
  );
  // `askHidden` returns "" both for a blank Enter and for closed/exhausted
  // stdin (e.g. Ctrl-D, or a script that piped fewer lines than expected) —
  // treat it as "nothing entered" rather than trying an empty passphrase.
  if (!passphrase) {
    throw new Error("No passphrase entered.");
  }
  return passphrase;
}

async function askNewPassphrase(): Promise<string> {
  return withPromptSession(async (session) => {
    const first = await session.askHidden("Enter new passphrase:");
    if (!first) {
      throw new Error("No passphrase entered — nothing was written.");
    }
    const confirm = await session.askHidden("Confirm new passphrase:");
    if (first !== confirm) {
      throw new Error("Passphrases did not match — nothing was written.");
    }
    return first;
  });
}

export function resolveCredentialsPath(): string {
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
