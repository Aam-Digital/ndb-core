import { isDeepStrictEqual } from "node:util";
import {
  migrateReportConfig,
  type MigratableReportConfig,
} from "./report-config-migration.js";
import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";

/** Legacy ReportConfig fields that the app no longer reads (all replaced by `reportDefinition`). */
const LEGACY_FIELDS = [
  "aggregationDefinitions",
  "aggregationDefinition",
  "neededArgs",
  "version",
] as const;

/** v1 SQL `neededArgs` names → the named placeholder that replaces them */
const REPORT_PERIOD_PLACEHOLDERS = new Map<unknown, string>([
  ["from", "startDate"],
  ["startDate", "startDate"],
  ["to", "endDate"],
  ["endDate", "endDate"],
]);

/** the `transformations` enabling the report period, as the Admin UI writes them */
const REPORT_PERIOD_TRANSFORMATIONS = {
  startDate: ["SQL_FROM_DATE"],
  endDate: ["SQL_TO_DATE"],
};

type LegacyReportConfig = MigratableReportConfig & {
  _id: string;
  neededArgs?: unknown;
  version?: unknown;
  transformations?: Record<string, string[]>;
};

type CleanupOutcome =
  { doc: LegacyReportConfig; warning?: string } | { skipReason: string };

/**
 * Remove the legacy definition fields from each ReportConfig doc, now that the app only reads
 * `reportDefinition`: `aggregationDefinitions` (reporting/exporting), and the SQL v1 fields
 * `aggregationDefinition` (a single query string), `neededArgs` (positional `?` args) and `version`.
 *
 * Follow-up to `consolidate-report-definition`, which copied the legacy fields into `reportDefinition`
 * but kept them. A doc that was never consolidated (no `reportDefinition` yet) is consolidated first.
 * An existing `reportDefinition` is never overwritten: the app has only used it since that release,
 * so a differing `aggregationDefinitions` is stale (e.g. the report was edited since); such a removal
 * is reported as a warning, and the migration backup allows restoring it.
 *
 * A v1 SQL query with positional `?` placeholders is converted to the named `$startDate`/`$endDate`
 * placeholders plus the matching `transformations`, so the report keeps its date range.
 * A doc that cannot be converted safely is left untouched and reported, to be fixed manually.
 *
 * Idempotent: once the legacy fields are gone, a re-run is a no-op.
 */
export const reportDefinitionLegacyCleanup: MigrationDefinition = {
  id: "oneoff-20261022-report-definition-legacy-cleanup",
  description:
    "Remove legacy ReportConfig fields (aggregationDefinitions, SQL v1 aggregationDefinition/neededArgs/version), consolidating them into reportDefinition first where needed. Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    const docs = (await ctx.couchdb.getAll(
      "ReportConfig",
    )) as LegacyReportConfig[];

    const warnings: string[] = [];
    let intended = 0;
    let skipped = 0;
    for (const doc of docs) {
      if (!LEGACY_FIELDS.some((field) => field in doc)) {
        continue;
      }

      const outcome = cleanUpReportConfig(doc);
      if ("skipReason" in outcome) {
        skipped++;
        warnings.push(`${doc._id} left unchanged: ${outcome.skipReason}`);
        continue;
      }
      if (outcome.warning) {
        warnings.push(`${doc._id}: ${outcome.warning}`);
      }

      intended++;
      ctx.validateJson(outcome.doc);
      ctx.log.info(`Migrating ${doc._id}`);
      await ctx.put(`/app/${doc._id}`, outcome.doc);
    }

    if (intended === 0 && skipped === 0) {
      ctx.log.info("No ReportConfig docs with legacy fields");
      return { changed: false, status: "no-change" };
    }

    return {
      changed: intended > 0,
      status: skipped > 0 ? "partial" : ctx.dryRun ? "dry-run" : "ok",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
};

function cleanUpReportConfig(original: LegacyReportConfig): CleanupOutcome {
  const doc = structuredClone(original);
  if (!isNonEmptyArray(doc.reportDefinition)) {
    migrateReportConfig(doc);
  }
  const hasDefinition = isNonEmptyArray(doc.reportDefinition);

  let warning: string | undefined;
  if (doc.mode !== "sql") {
    const legacy = original.aggregationDefinitions;
    if (!hasDefinition && isNonEmpty(legacy)) {
      return {
        skipReason:
          "its aggregationDefinitions is not a list of definitions and there is no reportDefinition",
      };
    }
    if (
      isNonEmptyArray(legacy) &&
      !isDeepStrictEqual(legacy, doc.reportDefinition)
    ) {
      warning =
        "removed aggregationDefinitions that differed from reportDefinition (kept reportDefinition, which the app uses)";
    }
  } else {
    if (!hasDefinition && isNonEmpty(original.aggregationDefinition)) {
      return {
        skipReason:
          "its aggregationDefinition is not an SQL query string and there is no reportDefinition",
      };
    }
    if (isNonEmpty(original.aggregationDefinitions)) {
      warning = "removed aggregationDefinitions, which SQL reports do not use";
    }
    const skipReason = convertPositionalArgs(doc);
    if (skipReason) {
      return { skipReason };
    }
  }

  for (const field of LEGACY_FIELDS) {
    delete doc[field];
  }
  return { doc, warning };
}

/**
 * Replace the v1 SQL positional `?` placeholders, filled from `neededArgs` in order,
 * by the named `$startDate`/`$endDate` placeholders and their `transformations`.
 * @returns why the doc cannot be converted safely, if so
 */
function convertPositionalArgs(doc: LegacyReportConfig): string | undefined {
  const neededArgs = doc.neededArgs;
  if (!isNonEmptyArray(neededArgs) || hasKeys(doc.transformations)) {
    // no positional args, or the named args are declared already
    return undefined;
  }

  const queryItems = collectQueryItems(doc.reportDefinition);
  const placeholderCount = queryItems.reduce(
    (sum, item) => sum + findPositionalPlaceholders(item.query).length,
    0,
  );
  if (placeholderCount === 0) {
    // the args are not used by any query
    return undefined;
  }

  const names = neededArgs.map((arg) => REPORT_PERIOD_PLACEHOLDERS.get(arg));
  if (names.some((name) => !name)) {
    return `neededArgs ${JSON.stringify(neededArgs)} are not supported; rewrite the query with $startDate/$endDate placeholders`;
  }
  if (queryItems.length !== 1 || placeholderCount !== names.length) {
    return `the "?" placeholders cannot be matched to neededArgs ${JSON.stringify(neededArgs)}; rewrite the query with $startDate/$endDate placeholders`;
  }

  const item = queryItems[0];
  const positions = findPositionalPlaceholders(item.query);
  let query = item.query;
  for (let i = positions.length - 1; i >= 0; i--) {
    query =
      query.slice(0, positions[i]) +
      "$" +
      names[i] +
      query.slice(positions[i] + 1);
  }
  item.query = query;
  doc.transformations = { ...REPORT_PERIOD_TRANSFORMATIONS };
  return undefined;
}

function collectQueryItems(node: unknown): { query: string }[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectQueryItems);
  }
  if (!node || typeof node !== "object") {
    return [];
  }
  const item = node as { query?: unknown; items?: unknown };
  const own = typeof item.query === "string" ? [item as { query: string }] : [];
  return [...own, ...collectQueryItems(item.items)];
}

/** Indices of the positional `?` placeholders, ignoring those in quoted strings and comments. */
function findPositionalPlaceholders(query: string): number[] {
  const positions: number[] = [];
  let i = 0;
  while (i < query.length) {
    const char = query[i];
    if (char === "'" || char === '"' || char === "`") {
      const end = query.indexOf(char, i + 1);
      i = end === -1 ? query.length : end + 1;
    } else if (query.startsWith("--", i)) {
      const end = query.indexOf("\n", i);
      i = end === -1 ? query.length : end + 1;
    } else if (query.startsWith("/*", i)) {
      const end = query.indexOf("*/", i + 2);
      i = end === -1 ? query.length : end + 2;
    } else {
      if (char === "?") {
        positions.push(i);
      }
      i++;
    }
  }
  return positions;
}

function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

function hasKeys(value: unknown): boolean {
  return !!value && typeof value === "object" && Object.keys(value).length > 0;
}

/** anything except undefined, null, an empty string, array or object */
function isNonEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "") {
    return false;
  }
  return typeof value !== "object" || hasKeys(value);
}
