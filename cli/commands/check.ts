import type { Command } from "commander";
import { loadCredentials } from "../lib/load-credentials.js";
import { printConnectivity } from "../lib/org-output.js";
import { OrgRunner } from "../lib/org-runner.js";

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

      process.exit(results.some((r) => !r.reachable) ? 1 : 0);
    });
}
