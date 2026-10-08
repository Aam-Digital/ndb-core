import type { Command } from "commander";
import {
  readCredentialsFile,
  type RawCredentialsFile,
  type RawOrgCredential,
} from "../credentials/merge.js";
import {
  backupPathFor,
  resolveCredentialsPath,
  writeCredentialsContent,
  type SystemCredentials,
} from "../lib/credentials.js";
import { loadCredentials } from "../lib/load-credentials.js";
import { type ConnectivityResult, OrgRunner } from "../lib/org-runner.js";
import { printConnectivity } from "../lib/org-output.js";
import { askYesNo, createPromptSession } from "../lib/prompt.js";

export function registerCheckCommand(program: Command): void {
  program
    .command("check")
    .description("Check connectivity to all (or selected) orgs")
    .action(async () => {
      const opts = program.opts();
      const creds = await loadCredentials(opts);
      if (!creds) return process.exit(2);
      const { orgs } = creds;
      const runner = new OrgRunner();

      const results = await runner.checkConnectivity(orgs);
      printConnectivity(results, !!opts.verbose);

      const failing = results.filter((r) => !r.reachable);
      // Only offer to edit the credentials file when there's someone to ask —
      // a non-interactive run (CI, a script) must keep reporting failures the
      // same way every time, not silently prune orgs on one bad connection.
      if (failing.length > 0 && process.stdin.isTTY) {
        await offerToRemoveFailing(failing, opts.credentials);
      }

      process.exit(failing.length > 0 ? 1 : 0);
    });
}

/**
 * After a failed connectivity check, ask whether the failing orgs should be
 * dropped from the credentials file — keep everything, drop them all, or
 * decide one at a time.
 */
async function offerToRemoveFailing(
  failing: ConnectivityResult[],
  credentialsPath: string | undefined,
): Promise<void> {
  const prompt = createPromptSession();
  try {
    const answer = (
      await prompt.ask(
        `\n${failing.length} org(s) failed. Remove from credentials? ` +
          `[k]eep (default) / [r]emove all / [a]sk one-by-one:`,
      )
    )
      .trim()
      .toLowerCase();

    let toRemove: SystemCredentials[];
    if (answer.startsWith("r")) {
      toRemove = failing.map((r) => r.org);
    } else if (answer.startsWith("a")) {
      toRemove = [];
      for (const result of failing) {
        const remove = await askYesNo(
          prompt,
          `  Remove ${OrgRunner.orgLabel(result.org)}? [y/N]`,
        );
        if (remove) toRemove.push(result.org);
      }
    } else {
      console.log("\nKept all orgs.\n");
      return;
    }

    if (toRemove.length === 0) {
      console.log("\nKept all orgs.\n");
      return;
    }

    await removeOrgsFromCredentials(toRemove, credentialsPath);
  } finally {
    prompt.close();
  }
}

/**
 * Remove the given orgs from the credentials file on disk. Raw entries are
 * matched by their *resolved* url — the same derivation `getCredentials`
 * uses (explicit `url`, or `name` + `$DOMAIN`) — since that's the only field
 * guaranteed to uniquely identify the entry a `SystemCredentials` came from.
 */
async function removeOrgsFromCredentials(
  toRemove: SystemCredentials[],
  credentialsPath: string | undefined,
): Promise<void> {
  const path = credentialsPath ?? resolveCredentialsPath();
  const file = await readCredentialsFile(path, { duplicates: "warn" });
  const domain = process.env["DOMAIN"] ?? "";

  const { kept, removedCount } = removeMatchingOrgs(
    file,
    new Set(toRemove.map((org) => org.url)),
    domain,
  );

  if (removedCount === 0) {
    console.log(
      "\nNothing matched in the credentials file — nothing written.\n",
    );
    return;
  }

  await writeCredentialsContent(
    path,
    JSON.stringify({ ...file, orgs: kept }, null, 2) + "\n",
  );
  console.log(
    `\nRemoved ${removedCount} org(s): ${toRemove.map((org) => OrgRunner.orgLabel(org)).join(", ")}`,
  );
  console.log(`Written: ${path}`);
  console.log(`Previous version kept at: ${backupPathFor(path)}\n`);
}

/**
 * Pure filtering step, split out from {@link removeOrgsFromCredentials} so it
 * can be tested without touching the filesystem or a prompt session.
 */
export function removeMatchingOrgs(
  file: RawCredentialsFile,
  removeUrls: Set<string>,
  domain: string,
): { kept: RawOrgCredential[]; removedCount: number } {
  const kept = file.orgs.filter(
    (raw) => !removeUrls.has(resolvedUrl(raw, domain) ?? ""),
  );
  return { kept, removedCount: file.orgs.length - kept.length };
}

/** Mirrors the url resolution `getCredentials` applies to a raw org entry. */
function resolvedUrl(
  raw: RawOrgCredential,
  domain: string,
): string | undefined {
  const explicit = raw.url?.trim();
  if (explicit) return explicit;
  const name = raw.name?.trim();
  return name && domain ? `${name}.${domain}` : undefined;
}
