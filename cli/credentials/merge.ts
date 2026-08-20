import { readCredentialsContent } from "../lib/credentials.js";

/**
 * An org entry exactly as it appears in the credentials file — unnormalised, so
 * it can be written back without losing fields the CLI does not know about.
 */
export interface RawOrgCredential {
  name?: string;
  url?: string;
  username?: string;
  password: string;
  category?: string;
  [key: string]: unknown;
}

/**
 * The credentials file in its object form. Unknown top-level keys (notably
 * `keycloak`) are preserved so a merge never drops them.
 */
export interface RawCredentialsFile {
  orgs: RawOrgCredential[];
  [key: string]: unknown;
}

export interface MergeResult {
  merged: RawCredentialsFile;
  /** Names of orgs that were not in the target file before. */
  added: string[];
  /** Positions of those orgs within `merged.orgs`, aligned with `added`. */
  addedIndices: number[];
  /** Names of orgs whose password (or other field) changed. */
  updated: string[];
  /** Names of orgs that matched but had nothing to change. */
  unchanged: string[];
  /** Names of orgs in the target file that the source file does not mention. */
  missing: string[];
  /** Whether `missing` orgs were dropped from `merged`. */
  pruned: boolean;
}

export interface ParseOptions {
  /**
   * What to do with two entries that refer to the same org. Ambiguity breaks
   * the merge only for the *incoming* file, where it is unclear which entry
   * should win — for the file being merged into, matching stays deterministic,
   * so warn rather than lock the operator out of their own credentials.
   */
  duplicates?: "reject" | "warn";
}

/** Read and validate a credentials file (plaintext or age-encrypted). */
export async function readCredentialsFile(
  path: string,
  options: ParseOptions = {},
): Promise<RawCredentialsFile> {
  return parseCredentialsFile(
    await readCredentialsContent(path),
    path,
    options,
  );
}

/**
 * Parse either supported layout — a bare array of orgs, or an object with an
 * `orgs` array plus extra keys such as `keycloak`.
 */
export function parseCredentialsFile(
  content: string,
  source: string,
  options: ParseOptions = {},
): RawCredentialsFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e: unknown) {
    throw new Error(
      `Failed to parse credentials from ${source}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (Array.isArray(parsed)) {
    return { orgs: validateOrgs(parsed, source, options) };
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(
      `Invalid credentials in ${source}: expected an array of orgs or an object with an "orgs" array.`,
    );
  }

  const { orgs, ...rest } = parsed as { orgs?: unknown };
  if (!Array.isArray(orgs)) {
    throw new Error(`Invalid credentials in ${source}: missing "orgs" array.`);
  }
  return { ...rest, orgs: validateOrgs(orgs, source, options) };
}

function validateOrgs(
  orgs: unknown[],
  source: string,
  options: ParseOptions,
): RawOrgCredential[] {
  const seen = new Map<string, number>();
  return orgs.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(
        `Invalid credentials in ${source}: org at index ${index} is not an object.`,
      );
    }
    const org = entry as RawOrgCredential;
    if (!org.password) {
      throw new Error(
        `Invalid credentials in ${source}: org at index ${index} is missing "password".`,
      );
    }
    if (!org.name?.trim() && !org.url?.trim()) {
      throw new Error(
        `Invalid credentials in ${source}: org at index ${index} must define either "url" or "name".`,
      );
    }

    // Two entries competing for the same match make merging ambiguous.
    const key = matchKey(org);
    const duplicateOf = seen.get(key);
    if (duplicateOf !== undefined) {
      const message =
        `orgs at index ${duplicateOf} and ${index} both refer to ` +
        `"${orgLabel(org)}"`;
      if (options.duplicates === "warn") {
        console.warn(`Warning: ${source}: ${message} — using the first.`);
      } else {
        throw new Error(`Invalid credentials in ${source}: ${message}.`);
      }
    }
    seen.set(key, index);

    return org;
  });
}

/**
 * Merge the orgs of a freshly collected credentials file into an existing one.
 *
 * The existing file is authoritative for everything the server-side collection
 * script does not know about (`category`, custom `url`/`username`, the
 * `keycloak` block, the spelling of `name`); the incoming file is authoritative
 * for the fields it actually provides, i.e. the passwords.
 */
export function mergeCredentials(
  existing: RawCredentialsFile,
  incoming: RawOrgCredential[],
  options: { prune?: boolean } = {},
): MergeResult {
  const orgs = existing.orgs.map((org) => ({ ...org }));
  const matchedIndices = new Set<number>();
  const addedOrgs: RawOrgCredential[] = [];
  const added: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];

  for (const incomingOrg of incoming) {
    const index = findMatch(orgs, incomingOrg, matchedIndices);
    if (index < 0) {
      const newOrg = { ...incomingOrg };
      orgs.push(newOrg);
      addedOrgs.push(newOrg);
      added.push(orgLabel(incomingOrg));
      continue;
    }

    matchedIndices.add(index);
    const merged = applyIncomingFields(orgs[index], incomingOrg);
    const label = orgLabel(orgs[index]);
    if (JSON.stringify(merged) === JSON.stringify(orgs[index])) {
      unchanged.push(label);
    } else {
      updated.push(label);
    }
    orgs[index] = merged;
  }

  const missing = orgs
    .slice(0, existing.orgs.length)
    .filter((_, index) => !matchedIndices.has(index))
    .map(orgLabel);

  const keptOrgs = options.prune
    ? orgs.filter(
        (_, index) =>
          index >= existing.orgs.length || matchedIndices.has(index),
      )
    : orgs;

  return {
    merged: { ...existing, orgs: keptOrgs },
    added,
    // Located by identity rather than by arithmetic: pruning drops entries from
    // the middle of the array, so the added orgs' positions are not simply
    // `existing.orgs.length + i`.
    addedIndices: addedOrgs.map((org) => keptOrgs.indexOf(org)),
    updated,
    unchanged,
    missing,
    pruned: !!options.prune,
  };
}

/** The optional org fields the server-collected file cannot supply. */
export interface OrgOverrides {
  category?: string;
  username?: string;
  url?: string;
}

/**
 * Return a copy of `file` with optional fields set on the given org positions.
 *
 * Blank input leaves a field absent rather than writing an empty string. That
 * distinction matters per field: an empty `username` would be sent as the
 * CouchDB user instead of falling back to `admin`, and an empty `url` would
 * suppress the `<name>.<DOMAIN>` resolution.
 */
export function applyOrgOverrides(
  file: RawCredentialsFile,
  overridesByIndex: Map<number, OrgOverrides>,
): RawCredentialsFile {
  const orgs = file.orgs.map((org, index) => {
    const overrides = overridesByIndex.get(index);
    if (!overrides) return org;

    const updated = { ...org };
    for (const [key, value] of Object.entries(overrides)) {
      const trimmed = value?.trim();
      if (trimmed) updated[key] = trimmed;
    }
    return updated;
  });
  return { ...file, orgs };
}

/** The distinct categories already in use, to offer as a hint when prompting. */
export function knownCategories(file: RawCredentialsFile): string[] {
  const categories = file.orgs
    .map((org) => org.category?.trim())
    .filter((category): category is string => !!category);
  return [...new Set(categories)].sort((a, b) => a.localeCompare(b));
}

/**
 * Locate the existing entry an incoming org refers to.
 *
 * Matching is deliberately forgiving about the `c-` instance prefix: the local
 * file may spell an org `c-myorg` while the server-side collection script
 * strips the prefix and emits `myorg`. Treating those as different orgs would
 * duplicate every entry instead of refreshing its password.
 */
function findMatch(
  orgs: RawOrgCredential[],
  incoming: RawOrgCredential,
  alreadyMatched: Set<number>,
): number {
  const available = (index: number) => !alreadyMatched.has(index);
  const name = incoming.name?.trim();
  const url = incoming.url?.trim();

  const candidates: ((org: RawOrgCredential) => boolean)[] = [];
  // Name *and* url first: when a name occurs more than once (different host
  // overrides for the same org) only the url tells the entries apart.
  if (name && url) {
    candidates.push(
      (org) => org.name?.trim() === name && org.url?.trim() === url,
    );
  }
  if (name) {
    candidates.push((org) => org.name?.trim() === name);
    candidates.push(
      (org) => stripInstancePrefix(org.name) === stripInstancePrefix(name),
    );
  }
  if (url) {
    candidates.push((org) => org.url?.trim() === url);
  }

  for (const matches of candidates) {
    const index = orgs.findIndex((org, i) => available(i) && matches(org));
    if (index >= 0) return index;
  }
  return -1;
}

/**
 * Copy over the fields the incoming file actually carries. Empty values are
 * ignored so a sparse source file cannot wipe curated local settings, and
 * `name` is left alone to keep the target file's spelling.
 */
function applyIncomingFields(
  existing: RawOrgCredential,
  incoming: RawOrgCredential,
): RawOrgCredential {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "name") continue;
    if (value === undefined || value === null || value === "") continue;
    merged[key] = value;
  }
  return merged;
}

function stripInstancePrefix(name: string | undefined): string {
  return (name ?? "").trim().replace(/^c-/, "").toLowerCase();
}

/**
 * Identity of an org for duplicate detection. `name` alone is not enough: the
 * same org name may legitimately appear twice with different `url` overrides
 * (e.g. a staging and a production host), and those are distinct entries.
 */
function matchKey(org: RawOrgCredential): string {
  const name = stripInstancePrefix(org.name);
  const url = org.url?.trim().toLowerCase() ?? "";
  return name ? `${name}|${url}` : `url:${url}`;
}

function orgLabel(org: RawOrgCredential): string {
  return org.name?.trim() || org.url?.trim() || "(unnamed)";
}

/**
 * Print what the merge would do. Never prints password values — only whether
 * they changed.
 */
export function printMergePreview(
  result: MergeResult,
  sourcePath: string,
  targetPath: string,
): void {
  console.log(`\nMerging ${sourcePath}\n     into ${targetPath}\n`);

  printGroup("+ added", result.added);
  printGroup("~ updated (new password)", result.updated);
  printGroup("= unchanged", result.unchanged);
  printGroup(result.pruned ? "- removed" : "! not in source", result.missing);

  if (result.missing.length > 0 && !result.pruned) {
    console.log(
      "\n  Orgs missing from the source file are kept. Use --prune to remove them.",
    );
  }
  if (result.added.length > 0 && result.missing.length > 0) {
    console.log(
      "\n  Both added and missing orgs — check the names above match up before\n" +
        "  confirming, otherwise the two files may use different naming.",
    );
  }
  console.log();
}

function printGroup(label: string, names: string[]): void {
  if (names.length === 0) return;
  console.log(
    `  ${label.padEnd(24)} ${String(names.length).padStart(3)}  ${names.join(", ")}`,
  );
}
