import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import {
  applyOrgOverrides,
  knownCategories,
  mergeCredentials,
  printMergePreview,
  readCredentialsFile,
  type MergeResult,
  type OrgOverrides,
  type RawCredentialsFile,
} from "../credentials/merge.js";
import {
  backupPathFor,
  isSameFile,
  resolveCredentialsPath,
  secureDelete,
  setPassphrasePromptSession,
  writeCredentialsContent,
} from "../lib/credentials.js";
import {
  askYesNo,
  createPromptSession,
  type PromptSession,
} from "../lib/prompt.js";

/**
 * Thrown by the merge steps below to unwind straight to the command's
 * `process.exit(code)` — the message (if any) is already printed by the
 * thrower, so the catch site only needs the code.
 */
class CliExit extends Error {
  constructor(readonly code: number) {
    super();
  }
}

export function registerCredentialsCommand(program: Command): void {
  const credentialsCmd = program
    .command("credentials")
    .description("Manage the local credentials file");

  credentialsCmd
    .command("merge <file>")
    .description(
      "Merge orgs from a server-collected credentials.json into the local file",
    )
    .option("--prune", "Also remove orgs that <file> does not contain")
    .option(
      "--keep-source",
      "Keep <file> instead of shredding it once the merge was written",
    )
    .option(
      "--new-category <category>",
      "Category to assign to every added org (skips the interactive prompt)",
    )
    .option(
      "--new-username <username>",
      'CouchDB username for every added org (falls back to $NEW_USERNAME, then "admin")',
      process.env["NEW_USERNAME"],
    )
    .option("--dry-run", "Preview the merge and exit without writing")
    .option("--yes", "Skip confirmation prompt")
    .option(
      "--new-passphrase",
      "Rotate the target's passphrase instead of reusing it",
    )
    .action(async (file: string, cmdOpts) => {
      // Note: this deliberately ignores --org/--category. Those filter which orgs
      // a command acts on; applying them here would drop every other org from the
      // file it rewrites.
      const opts = { ...program.opts(), ...cmdOpts };

      // One session for every prompt this command can make — passphrase entry
      // (source and target may both be `.age`), category questions, and the
      // final confirmation — so a second readline interface never competes
      // with the first for the same piped or pasted stdin and drops a line
      // meant for a different prompt.
      const prompt = createPromptSession();
      setPassphrasePromptSession(prompt);
      try {
        const { incoming, target, encryptOnly } = await resolveSourceAndTarget(
          file,
          opts,
        );

        if (encryptOnly) {
          await runEncryptOnly(incoming, target, file, opts, prompt);
          return;
        }

        const result = mergeCredentials(target.existing, incoming.orgs, {
          prune: !!opts.prune,
        });
        printMergePreview(result, file, target.path);

        if (opts.dryRun) {
          console.log("(--dry-run) Nothing written.\n");
          return;
        }
        // Rotation only means anything for an encrypted target, so a plaintext
        // target with nothing else to merge still takes the no-op path below
        // rather than writing and shredding the source for a "rotation" that
        // can't actually happen.
        const requestsRotation =
          !!opts.newPassphrase && target.path.endsWith(".age");
        const prunesSomething = result.pruned && result.missing.length > 0;
        if (
          result.added.length === 0 &&
          result.updated.length === 0 &&
          !prunesSomething &&
          !requestsRotation
        ) {
          // No write happened, so the source is not shredded either — the operator
          // may still want it for something else.
          console.log("Already up to date — nothing written.");
          if (!opts.keepSource) {
            console.log(
              `${file} still holds passwords in plaintext — shred it.`,
            );
          }
          console.log();
          return;
        }

        const merged = await buildMergedFile(
          result,
          target,
          file,
          opts,
          prompt,
        );
        if (!merged) return;

        await commitMerge(target, merged, file, opts);
      } catch (e: unknown) {
        if (e instanceof CliExit) return process.exit(e.code);
        console.error(`\n${e instanceof Error ? e.message : String(e)}\n`);
        return process.exit(1);
      } finally {
        setPassphrasePromptSession(undefined);
        prompt.close();
      }
    });
}

/**
 * Load the source file and figure out which local file it merges into,
 * rejecting the cases that would make the rest of the command nonsensical
 * (an empty source, or the source and target being the same file) — except
 * for the one same-file case that has an obvious, useful meaning: no
 * encrypted file exists yet, `--credentials` was not given, and the file
 * named on the command line *is* the plaintext default target. That is a
 * request to encrypt it in place, not a merge.
 */
async function resolveSourceAndTarget(
  file: string,
  opts: { credentials?: string },
): Promise<{
  incoming: RawCredentialsFile;
  target: Awaited<ReturnType<typeof resolveMergeTarget>>;
  encryptOnly: boolean;
}> {
  try {
    const incoming = await readCredentialsFile(file);
    if (incoming.orgs.length === 0) {
      console.error(`\n${file} contains no orgs — nothing to merge.\n`);
      throw new CliExit(2);
    }

    const decision = decideMergeTarget(
      file,
      opts.credentials,
      resolveDefaultMergeTargetPath(),
    );
    // Merging a file into itself would write the target and then shred it.
    if (decision.mode === "merge" && isSameFile(file, decision.path)) {
      console.error(
        `\n${file} is the credentials file itself — there is nothing to merge into.` +
          `\nCopy the server file somewhere else, or name a different target with --credentials.\n`,
      );
      throw new CliExit(2);
    }

    const target = await resolveMergeTarget(decision.path);
    return { incoming, target, encryptOnly: decision.mode === "encrypt" };
  } catch (e: unknown) {
    if (e instanceof CliExit) throw e;
    console.error(`\n${e instanceof Error ? e.message : String(e)}\n`);
    throw new CliExit(2);
  }
}

/**
 * Decide what `merge <file>` should write to, and whether that's a normal
 * merge or an in-place "encrypt the plaintext file I was given" bootstrap.
 *
 * The encrypt case only fires when the target was not pinned explicitly:
 * an explicit `--credentials <file>` pointing at the same file is still a
 * plain (nonsensical) self-merge, and a same-file `.age` source has no
 * plaintext to encrypt. Exported for testing without touching `process.cwd()`
 * or the real credentials-path resolution.
 */
export function decideMergeTarget(
  file: string,
  explicitCredentials: string | undefined,
  defaultPath: string,
): { mode: "merge" | "encrypt"; path: string } {
  const targetPath = explicitCredentials ?? defaultPath;
  if (
    !explicitCredentials &&
    !targetPath.endsWith(".age") &&
    isSameFile(file, targetPath)
  ) {
    return { mode: "encrypt", path: `${targetPath}.age` };
  }
  return { mode: "merge", path: targetPath };
}

/** The target path `merge` falls back to when `--credentials` is not given. */
function resolveDefaultMergeTargetPath(): string {
  try {
    return resolveCredentialsPath();
  } catch {
    return join(process.cwd(), "cli", "credentials.json.age");
  }
}

/**
 * Encrypt `file` to `target.path` as-is — no merge, since there is nothing to
 * merge it into. Mirrors the confirm/write/shred shape of the merge path
 * (see {@link commitMerge}) without the org-by-org prompting, which only
 * makes sense for orgs a merge is actually adding.
 */
async function runEncryptOnly(
  incoming: RawCredentialsFile,
  target: { path: string; existed: boolean },
  file: string,
  opts: { dryRun?: boolean; yes?: boolean; keepSource?: boolean },
  prompt: PromptSession,
): Promise<void> {
  console.log(
    `\nNo encrypted credentials file yet — encrypting ${file}` +
      `\n                                    to ${target.path} (${incoming.orgs.length} org(s)).\n`,
  );
  if (opts.dryRun) {
    console.log("(--dry-run) Nothing written.\n");
    return;
  }

  const question = opts.keepSource
    ? `Write ${target.path}? [y/N]`
    : `Write ${target.path} and shred ${file}? [y/N]`;
  if (!opts.yes && !(await askYesNo(prompt, question))) {
    console.log("\nAborted — nothing written.\n");
    return;
  }

  await commitMerge(target, incoming, file, opts);
}

/**
 * Fill in the added orgs' optional fields, validate the result is loadable,
 * and get the operator's final go-ahead before anything is written. Returns
 * `null` when the operator declined — as opposed to `CliExit`, that's a
 * normal, silent stop rather than an error.
 */
async function buildMergedFile(
  result: MergeResult,
  target: { path: string; existing: RawCredentialsFile },
  file: string,
  opts: {
    newCategory?: string;
    newUsername?: string;
    yes?: boolean;
    keepSource?: boolean;
  },
  prompt: PromptSession,
): Promise<RawCredentialsFile | null> {
  try {
    const merged = applyOrgOverrides(
      result.merged,
      await collectOrgDetails(result, target.existing, opts, prompt),
    );

    // Without DOMAIN an org that has no explicit url makes getCredentials
    // throw — the merged file would be unreadable by every later command,
    // and the source is about to be shredded.
    const unresolvable = result.addedIndices
      .filter((index) => !merged.orgs[index].url?.trim())
      .map((index) => merged.orgs[index].name);
    if (!process.env["DOMAIN"] && unresolvable.length > 0) {
      console.error(
        `\nDOMAIN is not set and no url was given for: ${unresolvable.join(", ")}.` +
          `\nThe merged file would fail to load. Set DOMAIN or give each org a url.\n`,
      );
      throw new CliExit(2);
    }

    // Both destructive actions are named: this prompt is the last gate
    // before the target is rewritten *and* the source file is destroyed.
    const question = opts.keepSource
      ? `Write ${target.path}? [y/N]`
      : `Write ${target.path} and shred ${file}? [y/N]`;
    if (!opts.yes && !(await askYesNo(prompt, question))) {
      console.log("\nAborted — nothing written.\n");
      return null;
    }
    return merged;
  } catch (e: unknown) {
    if (e instanceof CliExit) throw e;
    console.error(`\n${e instanceof Error ? e.message : String(e)}\n`);
    throw new CliExit(2);
  }
}

/**
 * Write the merged file and, once that succeeded, retire the source —
 * shredding it unless the operator asked to keep it.
 */
async function commitMerge(
  target: { path: string; existed: boolean },
  merged: RawCredentialsFile,
  file: string,
  opts: { keepSource?: boolean; newPassphrase?: boolean },
): Promise<void> {
  try {
    await writeCredentialsContent(
      target.path,
      JSON.stringify(merged, null, 2) + "\n",
      { forceNewPassphrase: !!opts.newPassphrase },
    );
  } catch (e: unknown) {
    console.error(`\n${e instanceof Error ? e.message : String(e)}\n`);
    throw new CliExit(1);
  }
  console.log(`\nWritten: ${target.path}`);
  if (target.existed) {
    console.log(`Previous version kept at: ${backupPathFor(target.path)}`);
  }

  // Only ever after a confirmed, successful write — the source is the last
  // remaining copy until the merged file is safely on disk.
  if (opts.keepSource) {
    console.log(
      `\n${file} still holds passwords in plaintext — shred it when done.`,
    );
  } else if (secureDelete(file)) {
    console.log(`Shredded source file: ${file}`);
  } else {
    console.warn(
      `\nCould not shred ${file} — it still holds passwords in plaintext.`,
    );
  }
  console.log();
}

/**
 * Load the target file to merge into, given its already-decided path. When
 * nothing exists there yet — the operator's first run, or the fresh `.age`
 * path an in-place encrypt writes to — start from an empty set.
 */
async function resolveMergeTarget(path: string): Promise<{
  path: string;
  existed: boolean;
  existing: RawCredentialsFile;
}> {
  if (!existsSync(path)) {
    console.log(`\nNo credentials file at ${path} yet — creating it.`);
    return { path, existed: false, existing: { orgs: [] } };
  }
  return {
    path,
    existed: true,
    // Warn rather than reject: the target is the operator's own file and the
    // rest of the CLI reads it fine, so a duplicate must not block the merge.
    existing: await readCredentialsFile(path, { duplicates: "warn" }),
  };
}

/**
 * Ask for the optional fields of each newly added org. The server-side
 * collection script only reports `name` and `password`, so everything else has
 * to come from the operator.
 *
 * A blank answer keeps the field out of the file entirely, which is what makes
 * the documented defaults (`admin`, `<name>.<DOMAIN>`) apply.
 */
async function collectOrgDetails(
  result: MergeResult,
  existing: RawCredentialsFile,
  opts: { newCategory?: string; newUsername?: string; yes?: boolean },
  prompt: PromptSession,
): Promise<Map<number, OrgOverrides>> {
  const overrides = new Map<number, OrgOverrides>();
  if (result.addedIndices.length === 0) return overrides;

  // Checked against undefined, not falsiness: `--new-category ""` is an
  // explicit "no category", and should skip the questions like any other value.
  const preset: OrgOverrides = {};
  if (opts.newCategory !== undefined) preset.category = opts.newCategory;
  if (opts.newUsername !== undefined) preset.username = opts.newUsername;

  const interactive = !opts.yes && process.stdin.isTTY;
  if (!interactive) {
    for (const index of result.addedIndices) overrides.set(index, preset);
    if (opts.newCategory === undefined) {
      console.log(
        `Added org(s) get no category — pass --new-category to set one.\n`,
      );
    }
    return overrides;
  }

  console.log(
    `Fill in the optional fields for the ${result.addedIndices.length} new org(s).`,
  );
  console.log("Press Enter to accept the [default] shown.\n");

  const known = knownCategories(existing);
  for (const [i, index] of result.addedIndices.entries()) {
    const label = result.added[i];
    console.log(`  ${label}`);
    overrides.set(index, {
      category:
        preset.category ??
        (await askOptional(prompt, "category", "", known.join(", "))),
      username:
        preset.username ?? (await askOptional(prompt, "username", "admin")),
      url: await askUrl(prompt, label),
    });
  }
  console.log();
  return overrides;
}

/**
 * Ask for one optional field. Returns `""` when the default is accepted, so the
 * field stays out of the file and the documented default keeps applying.
 */
async function askOptional(
  prompt: PromptSession,
  field: string,
  defaultValue: string,
  hint = "",
): Promise<string> {
  const shown = defaultValue ? `[${defaultValue}]` : "[none]";
  const suffix = hint ? ` (in use: ${hint})` : "";
  const answer = (await prompt.ask(`    ${field} ${shown}${suffix}:`)).trim();
  return answer === defaultValue ? "" : answer;
}

/**
 * Ask for the host override. Without DOMAIN the `<name>.<DOMAIN>` fallback
 * cannot resolve, and `getCredentials` rejects the whole file — so an explicit
 * url is required in that case rather than merely suggested.
 */
async function askUrl(prompt: PromptSession, name: string): Promise<string> {
  const domain = process.env["DOMAIN"];
  if (domain) return askOptional(prompt, "url", `${name}.${domain}`);

  for (let attempt = 0; attempt < 3; attempt++) {
    const answer = (await prompt.ask("    url (required):")).trim();
    if (answer) return answer;
    console.log(
      "    DOMAIN is not set, so the host cannot be derived — enter it explicitly.",
    );
  }
  throw new Error(`No url given for "${name}" and DOMAIN is not set.`);
}
