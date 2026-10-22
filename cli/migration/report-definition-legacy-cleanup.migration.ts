import { isDeepStrictEqual } from "node:util";
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

type LegacyReportConfig = {
  _id: string;
  mode?: string;
  /** reporting/exporting definition, replaced by reportDefinition */
  aggregationDefinitions?: unknown;
  /** SQL v1: a single query string, replaced by reportDefinition */
  aggregationDefinition?: unknown;
  reportDefinition?: unknown[];
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
 * A doc without a `reportDefinition` yet is consolidated first: `aggregationDefinitions`
 * (reporting/exporting) or the SQL v1 query string become its `reportDefinition`.
 * An existing `reportDefinition` is never overwritten: the app already uses it, so a differing
 * `aggregationDefinitions` is stale (e.g. the report was edited since); such a removal is reported
 * as a warning, and the migration backup allows restoring it.
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

    let status: MigrationResult["status"] = ctx.dryRun ? "dry-run" : "ok";
    if (skipped > 0) {
      status = "partial";
    }
    return {
      changed: intended > 0,
      status,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
};

/**
 * Move the legacy definition into `reportDefinition`:
 * SQL v1 keeps a single query string, reporting/exporting keep `aggregationDefinitions`.
 */
function consolidateReportDefinition(doc: LegacyReportConfig) {
  if (doc.mode === "sql") {
    if (typeof doc.aggregationDefinition === "string") {
      doc.reportDefinition = [{ query: doc.aggregationDefinition }];
    }
  } else if (isNonEmptyArray(doc.aggregationDefinitions)) {
    doc.reportDefinition = doc.aggregationDefinitions;
  }
}

function cleanUpReportConfig(original: LegacyReportConfig): CleanupOutcome {
  const doc = structuredClone(original);
  if (!isNonEmptyArray(doc.reportDefinition)) {
    consolidateReportDefinition(doc);
  }

  const check =
    doc.mode === "sql"
      ? checkSqlReport(original, doc)
      : checkAggregationReport(original, doc);
  if (check.skipReason) {
    return { skipReason: check.skipReason };
  }

  for (const field of LEGACY_FIELDS) {
    delete doc[field];
  }
  return { doc, warning: check.warning };
}

type LegacyCheck = { skipReason?: string; warning?: string };

/** reporting/exporting: the definition was `aggregationDefinitions` */
function checkAggregationReport(
  original: LegacyReportConfig,
  doc: LegacyReportConfig,
): LegacyCheck {
  const legacy = original.aggregationDefinitions;
  if (!isNonEmptyArray(doc.reportDefinition) && isNonEmpty(legacy)) {
    return {
      skipReason:
        "its aggregationDefinitions is not a list of definitions and there is no reportDefinition",
    };
  }
  if (
    isNonEmptyArray(legacy) &&
    !isDeepStrictEqual(legacy, doc.reportDefinition)
  ) {
    return {
      warning:
        "removed aggregationDefinitions that differed from reportDefinition (kept reportDefinition, which the app uses)",
    };
  }
  return {};
}

/** SQL v1: the definition was a single query string with positional args */
function checkSqlReport(
  original: LegacyReportConfig,
  doc: LegacyReportConfig,
): LegacyCheck {
  if (
    !isNonEmptyArray(doc.reportDefinition) &&
    isNonEmpty(original.aggregationDefinition)
  ) {
    return {
      skipReason:
        "its aggregationDefinition is not an SQL query string and there is no reportDefinition",
    };
  }
  const skipReason = convertPositionalArgs(doc);
  if (skipReason) {
    return { skipReason };
  }
  if (isNonEmpty(original.aggregationDefinitions)) {
    return {
      warning: "removed aggregationDefinitions, which SQL reports do not use",
    };
  }
  return {};
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

/** quoted strings and comments, whose `?` are not placeholders: [start, end] */
const SKIPPED_SPANS: [string, string][] = [
  ["'", "'"],
  ['"', '"'],
  ["`", "`"],
  ["--", "\n"],
  ["/*", "*/"],
];

/** Indices of the positional `?` placeholders, ignoring those in quoted strings and comments. */
function findPositionalPlaceholders(query: string): number[] {
  const positions: number[] = [];
  let i = 0;
  while (i < query.length) {
    const skipTo = endOfSkippedSpan(query, i);
    if (skipTo !== undefined) {
      i = skipTo;
      continue;
    }
    if (query[i] === "?") {
      positions.push(i);
    }
    i++;
  }
  return positions;
}

/** the index after a quoted string or comment starting at `i`, if one starts there */
function endOfSkippedSpan(query: string, i: number): number | undefined {
  for (const [start, end] of SKIPPED_SPANS) {
    if (query.startsWith(start, i)) {
      const close = query.indexOf(end, i + start.length);
      return close === -1 ? query.length : close + end.length;
    }
  }
  return undefined;
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
