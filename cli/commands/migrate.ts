import type { Command } from "commander";
import { Couchdb } from "../lib/couchdb-client.js";
import type { SystemCredentials } from "../lib/credentials.js";
import { loadCredentials } from "../lib/load-credentials.js";
import { printConnectivity } from "../lib/org-output.js";
import { OrgRunner, type OrgOutcome } from "../lib/org-runner.js";
import { askConfirmation } from "../lib/prompt.js";
import { withTimeout } from "../lib/timeout.js";
import { ConsoleLogger } from "../migration/console-logger.js";
import {
  failedMigrationResult,
  type MigrationOutcome,
} from "../migration/migration-definition.js";
import {
  computeExitCode,
  printBanner,
  printOutcome,
  printSummary,
} from "../migration/migration-output.js";
import { migrations } from "../migration/migrations.js";
import { TrackedMigrationContext } from "../migration/tracked-migration-context.js";

export function registerMigrateCommand(program: Command): void {
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

      const creds = await loadCredentials(opts);
      if (!creds) return process.exit(2);
      const { orgs } = creds;
      const runner = new OrgRunner();
      const logger = new ConsoleLogger(!!opts.verbose);

      const connectivity = await runner.checkConnectivity(orgs);
      printConnectivity(connectivity);
      const reachable = connectivity
        .filter((r) => r.reachable)
        .map((r) => r.org);
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
}
