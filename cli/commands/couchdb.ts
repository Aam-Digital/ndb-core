import type { Command } from "commander";
import {
  deleteOrphanedAttachments,
  findOrphanedAttachments,
} from "../couchdb/cleanup-attachments.js";
import { getConflicts } from "../couchdb/conflicts.js";
import { editEntities, searchEntities } from "../couchdb/search-and-replace.js";
import { loadCredentials } from "../lib/load-credentials.js";
import { runForAllOrgs } from "../lib/org-runner.js";
import { askConfirmation } from "../lib/prompt.js";

async function runSearch(
  program: Command,
  regex: string,
  cmdOpts: any,
): Promise<void> {
  const opts = { ...program.opts(), ...cmdOpts };
  const creds = await loadCredentials(opts);
  if (!creds) return process.exit(2);
  const { orgs } = creds;

  const results = await runForAllOrgs(orgs, async (couchdb) =>
    searchEntities(couchdb, regex, cmdOpts.type as string),
  );
  console.log(JSON.stringify(results, null, 2));
}

async function runEdit(
  program: Command,
  regex: string,
  replace: string,
  cmdOpts: any,
): Promise<void> {
  const opts = { ...program.opts(), ...cmdOpts };
  const creds = await loadCredentials(opts);
  if (!creds) return process.exit(2);
  const { orgs } = creds;

  // Dry-run preview first
  const preview = await runForAllOrgs(orgs, async (couchdb) =>
    editEntities(couchdb, regex, replace, cmdOpts.type as string, true),
  );
  console.log("\nPreview (matched docs):");
  console.log(JSON.stringify(preview, null, 2));

  if (opts.dryRun) return;

  const totalMatches = Object.values(preview).flat().length;
  if (totalMatches === 0) {
    console.log("\nNo matches — nothing to write.\n");
    return;
  }

  if (!opts.yes) {
    const confirmed = await askConfirmation(
      `\nApply edits to ${totalMatches} doc(s)? [y/N]`,
    );
    if (!confirmed) {
      console.log("\nAborted.\n");
      return;
    }
  }

  const results = await runForAllOrgs(orgs, async (couchdb) =>
    editEntities(couchdb, regex, replace, cmdOpts.type as string, false),
  );
  console.log("\nWritten:");
  console.log(JSON.stringify(results, null, 2));
}

async function runCleanupAttachments(
  program: Command,
  cmdOpts: any,
): Promise<void> {
  const opts = { ...program.opts(), ...cmdOpts };
  const creds = await loadCredentials(opts);
  if (!creds) return process.exit(2);
  const { orgs } = creds;

  const preview = await runForAllOrgs(orgs, (couchdb) =>
    findOrphanedAttachments(couchdb),
  );
  console.log("\nOrphaned attachments (no matching entity in app):");
  console.log(JSON.stringify(preview, null, 2));

  if (opts.dryRun) return;

  const totalOrphans = Object.values(preview).flat().length;
  if (totalOrphans === 0) {
    console.log("\nNo orphaned attachments — nothing to delete.\n");
    return;
  }

  if (!opts.yes) {
    const confirmed = await askConfirmation(
      `\nDelete ${totalOrphans} orphaned attachment doc(s)? [y/N]`,
    );
    if (!confirmed) {
      console.log("\nAborted.\n");
      return;
    }
  }

  const results = await runForAllOrgs(orgs, async (couchdb) => {
    const orphans = await findOrphanedAttachments(couchdb);
    return deleteOrphanedAttachments(couchdb, orphans);
  });
  console.log("\nDeleted:");
  console.log(JSON.stringify(results, null, 2));
}

async function runConflicts(program: Command): Promise<void> {
  const opts = program.opts();
  const creds = await loadCredentials(opts);
  if (!creds) return process.exit(2);
  const { orgs } = creds;

  const results = await runForAllOrgs(orgs, (couchdb) => getConflicts(couchdb));
  console.log(JSON.stringify(results, null, 2));
}

export function registerCouchdbCommand(program: Command): void {
  const couchdbCmd = program
    .command("couchdb")
    .description("CouchDB document operations");

  couchdbCmd
    .command("search <regex>")
    .description("Find entities matching a regex")
    .requiredOption("--type <type>", "Entity type prefix (e.g. Child)")
    .action((regex: string, cmdOpts) => runSearch(program, regex, cmdOpts));

  couchdbCmd
    .command("edit <regex> <replace>")
    .description("Regex replace in entities (use --dry-run to preview)")
    .requiredOption("--type <type>", "Entity type prefix")
    .option("--dry-run", "Preview without writing")
    .option("--yes", "Skip confirmation")
    .action((regex: string, replace: string, cmdOpts) =>
      runEdit(program, regex, replace, cmdOpts),
    );

  couchdbCmd
    .command("cleanup-attachments")
    .description(
      "Delete app-attachments docs whose entity no longer exists in app (use --dry-run to preview)",
    )
    .option("--dry-run", "Preview without deleting")
    .option("--yes", "Skip confirmation")
    .action((cmdOpts) => runCleanupAttachments(program, cmdOpts));

  couchdbCmd
    .command("conflicts")
    .description("List conflicted documents across all orgs")
    .action(() => runConflicts(program));
}
