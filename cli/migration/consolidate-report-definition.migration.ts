import {
  migrateReportConfig,
  type MigratableReportConfig,
} from "../../src/app/features/reporting/report-config-migration.js";
import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";

/**
 * Consolidate each ReportConfig doc's legacy definition fields into the unified `reportDefinition`:
 * `aggregationDefinitions` (reporting/exporting) and the v1 SQL `aggregationDefinition` string.
 *
 * Non-destructive: the legacy fields are intentionally kept, so this can be run together with (or
 * before) the deploy that starts reading `reportDefinition` — both coexist, so old code keeps
 * working. A separate follow-up migration removes the legacy fields once every environment runs
 * the new code. Idempotent — safe to re-run.
 */
export const consolidateReportDefinition: MigrationDefinition = {
  id: "consolidate-report-definition",
  description:
    "Consolidate ReportConfig legacy definition fields (aggregationDefinitions, v1 aggregationDefinition) into reportDefinition (keeps the old fields). Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    const docs = (await ctx.couchdb.getAll("ReportConfig")) as Array<
      MigratableReportConfig & { _id: string }
    >;

    let intended = 0;
    for (const doc of docs) {
      const before = JSON.stringify(doc);
      migrateReportConfig(doc);
      if (JSON.stringify(doc) === before) {
        continue;
      }

      intended++;
      ctx.validateJson(doc);
      ctx.log.info(`Migrating ${doc._id}`);
      await ctx.put(`/app/${doc._id}`, doc);
    }

    if (intended === 0) {
      ctx.log.info("No ReportConfig docs need migration");
      return { changed: false, status: "no-change" };
    }

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
