/**
 * A minimal shape of a ReportConfig doc/entity relevant to the definition migration.
 * Kept structural (no @angular imports) so this file can be reused by the migration CLI.
 */
export interface MigratableReportConfig {
  mode?: string;
  /** @deprecated reporting/exporting definition — consolidated into reportDefinition */
  aggregationDefinitions?: any[];
  /** @deprecated (sql v1) a single SQL query string — consolidated into reportDefinition */
  aggregationDefinition?: string;
  reportDefinition?: any[];
}

/**
 * Consolidate a ReportConfig's legacy definition fields into the unified `reportDefinition`,
 * so all report modes share a single definition property.
 *
 * Mode-aware, because the canonical definition differs per mode:
 * - "reporting"/"exporting" (and unset, which defaults to reporting): the definition lives in
 *   `aggregationDefinitions`; any `reportDefinition` present is stale (e.g. left over from a mode
 *   switch in the old two-field form) → overwrite it with `aggregationDefinitions`.
 * - "sql": `reportDefinition` (v2) is canonical when present; a legacy v1 `aggregationDefinition`
 *   (a single SQL query string) is folded into `reportDefinition` as `[{ query }]`.
 *
 * **Non-destructive:** the legacy fields are intentionally kept, so this migration is safe to run
 * before the code that reads `reportDefinition` is deployed (both coexist; old code keeps reading
 * the old fields). A follow-up migration removes the legacy fields once every environment runs the
 * new code. Idempotent and safe to re-run.
 */
export function migrateReportConfig<T extends MigratableReportConfig>(
  report: T,
): T {
  if (!report || typeof report !== "object") {
    return report;
  }

  const hasReportDefinition =
    Array.isArray(report.reportDefinition) &&
    report.reportDefinition.length > 0;

  if (report.mode === "sql") {
    // v1 sql: a single query string → a one-item reportDefinition
    if (
      !hasReportDefinition &&
      typeof report.aggregationDefinition === "string"
    ) {
      report.reportDefinition = [{ query: report.aggregationDefinition }];
    }
  } else {
    // reporting/exporting/unset: aggregationDefinitions is the real definition
    const legacy = report.aggregationDefinitions;
    if (Array.isArray(legacy) && legacy.length > 0) {
      report.reportDefinition = legacy;
    }
  }

  return report;
}
