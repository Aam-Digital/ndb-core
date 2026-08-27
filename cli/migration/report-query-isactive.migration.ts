import { migrateIsActiveQuerySelection } from "../../src/app/core/export/is-active-query-migration.js";
import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";

/**
 * Rewrite report queries that select on the removed, calculated `isActive` property:
 *   `[*isActive=true]`  -> `:filterActive`
 *   `[*isActive=false]` -> `:filterInactive`
 *
 * Entities do not provide `isActive` anymore, so json-query cannot evaluate such a selection and
 * the affected report rows silently come out empty. QueryService translates the legacy syntax at
 * execution time as well, so reports keep working before this has run; this migration writes the
 * fix back to the stored documents, so the definitions shown in the Admin UI match what is
 * executed and the runtime translation can eventually be dropped.
 *
 * Scope: non-SQL reports. SQL reports carry plain SQL in their definition, where the json-query
 * selection syntax has no meaning.
 *
 * Every nested `query` property is covered (subQueries, aggregations). Idempotent: after a run no
 * `isActive` selection is left, so re-running is a no-op.
 */
export const reportQueryIsActive: MigrationDefinition = {
  id: "oneoff-20260807-report-query-isactive",
  description:
    "Rewrite [*isActive=true]/[*isActive=false] selections in non-SQL ReportConfig queries to the :filterActive/:filterInactive helpers. Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    const docs = (await ctx.couchdb.getAll("ReportConfig")) as Array<{
      _id: string;
      mode?: string;
    }>;

    let intended = 0;
    for (const doc of docs) {
      if (doc.mode === "sql") {
        continue;
      }

      const before = JSON.stringify(doc);
      const migrated = JSON.parse(before, (key, value) =>
        key === "query" ? migrateIsActiveQuerySelection(value) : value,
      );
      if (JSON.stringify(migrated) === before) {
        continue;
      }

      intended++;
      ctx.validateJson(migrated);
      ctx.log.info(`Migrating ${doc._id}`);
      await ctx.put(`/app/${doc._id}`, migrated);
    }

    if (intended === 0) {
      ctx.log.info("No ReportConfig docs need migration");
      return { changed: false, status: "no-change" };
    }

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
