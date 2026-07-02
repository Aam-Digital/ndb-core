import * as readline from "readline";
import { Command } from "commander";
import { Couchdb } from "./lib/couchdb-client.js";
import { getConflicts } from "./couchdb/conflicts.js";
import { editEntities, searchEntities } from "./couchdb/search-and-replace.js";
import { formatStatisticsCsv, getOrgStatistics } from "./couchdb/statistics.js";
import { getCredentials } from "./lib/credentials.js";
import {
  getKeycloakToken,
  getUsersFromKeycloak,
} from "./lib/keycloak-client.js";
import { ConsoleLogger } from "./migration/console-logger.js";
import {
  failedMigrationResult,
  type MigrationOutcome,
} from "./migration/migration-definition.js";
import {
  computeExitCode,
  printBanner,
  printOutcome,
  printSummary,
} from "./migration/migration-output.js";
import { migrations } from "./migration/migrations.js";
import { TrackedMigrationContext } from "./migration/tracked-migration-context.js";
import { OrgRunner, runForAllOrgs, type OrgOutcome } from "./lib/org-runner.js";
import { printConnectivity } from "./lib/org-output.js";
import { withTimeout } from "./lib/timeout.js";
import type { SystemCredentials } from "./lib/credentials.js";

const program = new Command();
program.name("ndb-core").description("Aam Digital admin CLI").version("1.0.0");

// ─── Global options ──────────────────────────────────────────────────────────

program
  .option("--credentials <path>", "Path to credentials.json")
  .option("--org <orgs>", "Comma-separated org names or URLs")
  .option("--category <category>", "Filter orgs by credential category")
  .option("--verbose", "Show detailed output");

// ─── check ───────────────────────────────────────────────────────────────────

program
  .command("check")
  .description("Check connectivity to all (or selected) orgs")
  .action(async () => {
    const opts = program.opts();
    const creds = loadCredentials(opts);
    if (!creds) return process.exit(2);
    const { orgs } = creds;
    const runner = new OrgRunner();

    const results = await runner.checkConnectivity(orgs);
    printConnectivity(results, !!opts.verbose);

    process.exit(results.some((r) => !r.reachable) ? 1 : 0);
  });

// ─── migrate ─────────────────────────────────────────────────────────────────

const migrateCmd = program
  .command("migrate")
  .description("Run database migrations");

migrateCmd
  .command("list")
  .description("List all available migrations")
  .action(() => {
    console.log("\nAvailable migrations:\n");
    for (const m of migrations) {
      console.log(`  ${m.id.padEnd(36)}  ${m.description}`);
    }
    console.log();
  });

migrateCmd
  .command("run <id>")
  .description("Run a migration (preview first, then confirm)")
  .option("--dry-run", "Preview changes and exit without writing")
  .option("--yes", "Skip confirmation prompt")
  .option("--timeout <seconds>", "Per-org timeout in seconds", "30")
  .action(async (id: string, cmdOpts) => {
    const opts = { ...program.opts(), ...cmdOpts };
    const migration = migrations.find((m) => m.id === id);
    if (!migration) {
      console.error(`\nUnknown migration id: "${id}"`);
      console.error(`Run "migrate list" to see available migrations.\n`);
      return process.exit(2);
    }
    const timeoutSeconds = Number(cmdOpts.timeout);
    if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
      console.error(`\nInvalid --timeout: "${cmdOpts.timeout}"\n`);
      return process.exit(2);
    }

    const creds = loadCredentials(opts);
    if (!creds) return process.exit(2);
    const { orgs } = creds;
    const runner = new OrgRunner();
    const logger = new ConsoleLogger(!!opts.verbose);

    const connectivity = await runner.checkConnectivity(orgs);
    printConnectivity(connectivity);
    const reachable = connectivity.filter((r) => r.reachable).map((r) => r.org);
    const unreachableCount = connectivity.filter((r) => !r.reachable).length;

    if (reachable.length === 0) {
      console.error("\nNo reachable orgs — nothing to do.\n");
      return process.exit(1);
    }

    const runOnOrg = async (
      couchdb: Couchdb,
      org: SystemCredentials,
      dryRun: boolean,
    ): Promise<MigrationOutcome> => {
      const ctx = new TrackedMigrationContext(couchdb, org, dryRun, logger);
      try {
        const result = await withTimeout(
          migration.run(ctx),
          timeoutSeconds * 1000,
          `Migration timed out after ${timeoutSeconds}s`,
        );
        return { result, writeStats: ctx.getWriteStats() };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const result = failedMigrationResult(msg);
        result.details = e instanceof Error ? e.stack : undefined;
        return { result, writeStats: ctx.getWriteStats() };
      }
    };

    // Each org is previewed, confirmed, and (if approved) applied before moving
    // on to the next — so a rejected or problematic org never blocks review of
    // the rest, and an early "no" can't be mistaken for a blanket abort.
    printBanner("MIGRATE", migration);
    const outcomes: OrgOutcome<MigrationOutcome>[] = [];
    let skippedCount = 0;
    for (const org of reachable) {
      const couchdb = new Couchdb(org.url, org.password, org.username);
      console.log();

      const preview = await runOnOrg(couchdb, org, true);
      printOutcome({ org, result: preview }, false, !!opts.verbose);

      if (opts.dryRun || !preview.result.changed) {
        outcomes.push({ org, result: preview });
        continue;
      }

      if (!opts.yes) {
        const confirmed = await askConfirmation(
          `Apply ${preview.writeStats.intended} change(s) to ${OrgRunner.orgLabel(org)}? [y/N]`,
        );
        if (!confirmed) {
          console.log("Skipped.");
          // Excluded from `outcomes` on purpose: it was never applied, so
          // counting it as "changed" (its dry-run status) would misreport
          // what actually happened to this org.
          skippedCount++;
          continue;
        }
      }

      const applied = await runOnOrg(couchdb, org, false);
      printOutcome({ org, result: applied }, true, !!opts.verbose);
      outcomes.push({ org, result: applied });
    }

    if (opts.dryRun) {
      console.log("\n(--dry-run) No writes performed.\n");
    }
    if (skippedCount > 0) {
      console.log(`${skippedCount} org(s) skipped (declined) — not applied.`);
    }

    printSummary(outcomes, unreachableCount);
    process.exit(computeExitCode(outcomes, unreachableCount));
  });

// ─── couchdb ─────────────────────────────────────────────────────────────────

const couchdbCmd = program
  .command("couchdb")
  .description("CouchDB document operations");

couchdbCmd
  .command("search <regex>")
  .description("Find entities matching a regex")
  .requiredOption("--type <type>", "Entity type prefix (e.g. Child)")
  .action(async (regex: string, cmdOpts) => {
    const opts = { ...program.opts(), ...cmdOpts };
    const creds = loadCredentials(opts);
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
    const creds = loadCredentials(opts);
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
    const creds = loadCredentials(opts);
    if (!creds) return process.exit(2);
    const { orgs } = creds;

    const results = await runForAllOrgs(orgs, (couchdb) =>
      getConflicts(couchdb),
    );
    console.log(JSON.stringify(results, null, 2));
  });

// ─── statistics ──────────────────────────────────────────────────────────────

program
  .command("statistics")
  .description("Get entity and user statistics across all orgs")
  .option("--format <fmt>", "Output format: json or csv", "json")
  .action(async (cmdOpts) => {
    const opts = { ...program.opts(), ...cmdOpts };
    const credentials = loadCredentials(opts);
    if (!credentials) return process.exit(2);
    const orgs = OrgRunner.sortByCategory(credentials.orgs);
    const { keycloak } = credentials;

    let token: string;
    try {
      token = await getKeycloakToken(keycloak);
    } catch (e: unknown) {
      console.error(
        "Failed to get Keycloak token:",
        e instanceof Error ? e.message : e,
      );
      return process.exit(1);
    }

    const stats = [];
    for (const org of orgs) {
      const couchdb = new Couchdb(org.url, org.password, org.username);
      let users: unknown[] = [];
      let usersError = false;
      try {
        const parsedUrl = new URL(
          org.url.includes("://") ? org.url : `https://${org.url}`,
        );
        const realm = parsedUrl.hostname.split(".")[0];
        users = await getUsersFromKeycloak(realm, token, keycloak);
      } catch {
        console.warn("Couldn't get users from Keycloak for", org.url);
        usersError = true;
      }
      stats.push(await getOrgStatistics(couchdb, users, usersError));
    }

    if (opts.format === "csv") {
      console.log(formatStatisticsCsv(stats));
    } else {
      console.log(JSON.stringify(stats, null, 2));
    }
  });

// ─── Bootstrap ───────────────────────────────────────────────────────────────

program.parse(process.argv);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadCredentials(opts: {
  credentials?: string;
  org?: string;
  category?: string;
}): {
  orgs: SystemCredentials[];
  keycloak: ReturnType<typeof getCredentials>["keycloak"];
} | null {
  let file: ReturnType<typeof getCredentials>;
  try {
    file = getCredentials(opts.credentials);
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : String(e));
    return null;
  }

  const orgs = OrgRunner.filterOrgs(file.orgs, opts);
  if (orgs.length === 0) {
    const filter = opts.org
      ? `--org "${opts.org}"`
      : opts.category
        ? `--category "${opts.category}"`
        : "all";
    console.error(`\nNo orgs matched ${filter}.\n`);
    return null;
  }
  return { orgs, keycloak: file.keycloak };
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question + " ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}
