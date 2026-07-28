import type { Command } from "commander";
import {
  formatStatisticsCsv,
  getOrgStatistics,
} from "../couchdb/statistics.js";
import { Couchdb } from "../lib/couchdb-client.js";
import {
  getKeycloakToken,
  getUsersFromKeycloak,
} from "../lib/keycloak-client.js";
import { loadCredentials } from "../lib/load-credentials.js";
import { OrgRunner } from "../lib/org-runner.js";

export function registerStatisticsCommand(program: Command): void {
  program
    .command("statistics")
    .description("Get entity and user statistics across all orgs")
    .option("--format <fmt>", "Output format: json or csv", "json")
    .action(async (cmdOpts) => {
      const opts = { ...program.opts(), ...cmdOpts };
      const credentials = await loadCredentials(opts);
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
}
