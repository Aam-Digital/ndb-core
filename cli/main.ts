import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Command } from "commander";
import { registerCheckCommand } from "./commands/check.js";
import { registerCouchdbCommand } from "./commands/couchdb.js";
import { registerCredentialsCommand } from "./commands/credentials.js";
import { registerMigrateCommand } from "./commands/migrate.js";
import { registerStatisticsCommand } from "./commands/statistics.js";

// ─── .env ────────────────────────────────────────────────────────────────────
// Loaded from this file's own directory, not cwd, so it works regardless of
// where `npm run cli` is invoked from. Optional: operators aren't required to
// have one, and vars already set in the shell take precedence over it.
try {
  process.loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), ".env"));
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}

const program = new Command();
program.name("ndb-core").description("Aam Digital admin CLI").version("1.0.0");

// ─── Global options ──────────────────────────────────────────────────────────

program
  .option("--credentials <path>", "Path to credentials.json")
  .option("--org <orgs>", "Comma-separated org names or URLs")
  .option("--category <category>", "Filter orgs by credential category")
  .option("--verbose", "Show detailed output");

// ─── Commands ────────────────────────────────────────────────────────────────

registerCheckCommand(program);
registerMigrateCommand(program);
registerCouchdbCommand(program);
registerCredentialsCommand(program);
registerStatisticsCommand(program);

// ─── Bootstrap ───────────────────────────────────────────────────────────────

program.parse(process.argv);
