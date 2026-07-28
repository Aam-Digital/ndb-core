import type { Command } from "commander";
import { getConflicts } from "../couchdb/conflicts.js";
import { editEntities, searchEntities } from "../couchdb/search-and-replace.js";
import { loadCredentials } from "../lib/load-credentials.js";
import { runForAllOrgs } from "../lib/org-runner.js";
import { askConfirmation } from "../lib/prompt.js";

export function registerCouchdbCommand(program: Command): void {
  const couchdbCmd = program
    .command("couchdb")
    .description("CouchDB document operations");

  couchdbCmd
    .command("search <regex>")
    .description("Find entities matching a regex")
    .requiredOption("--type <type>", "Entity type prefix (e.g. Child)")
    .action(async (regex: string, cmdOpts) => {
      const opts = { ...program.opts(), ...cmdOpts };
      const creds = await loadCredentials(opts);
      if (!creds) return process.exit(2);
      const { orgs } = creds;

      const results = await runForAllOrgs(orgs, async (couchdb) =>
        searchEntities(couchdb, regex, cmdOpts.type as string),
      );
      console.log(JSON.stringify(results, null, 2));
    });

  couchdbCmd
    .command("edit <regex> <replace>")
    .description("Regex replace in entities (use --dry-run to preview)")
    .requiredOption("--type <type>", "Entity type prefix")
    .option("--dry-run", "Preview without writing")
    .option("--yes", "Skip confirmation")
    .action(async (regex: string, replace: string, cmdOpts) => {
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
    });

  couchdbCmd
    .command("conflicts")
    .description("List conflicted documents across all orgs")
    .action(async () => {
      const opts = program.opts();
      const creds = await loadCredentials(opts);
      if (!creds) return process.exit(2);
      const { orgs } = creds;

      const results = await runForAllOrgs(orgs, (couchdb) =>
        getConflicts(couchdb),
      );
      console.log(JSON.stringify(results, null, 2));
    });
}
