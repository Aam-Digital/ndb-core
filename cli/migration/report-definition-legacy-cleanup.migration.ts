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
 * SQL v1 keeps a single query string (older SQL reports a list of query strings in
 * `aggregationDefinitions`), reporting/exporting keep `aggregationDefinitions`.
 */
function consolidateReportDefinition(doc: LegacyReportConfig) {
  if (doc.mode !== "sql") {
    if (isNonEmptyArray(doc.aggregationDefinitions)) {
      doc.reportDefinition = doc.aggregationDefinitions;
    }
  } else if (typeof doc.aggregationDefinition === "string") {
    doc.reportDefinition = [{ query: doc.aggregationDefinition }];
  } else if (isQueryStringList(doc.aggregationDefinitions)) {
    doc.reportDefinition = doc.aggregationDefinitions.map((query) => ({
      query,
    }));
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

/** SQL v1: the definition was a single query string (or a list of them) with positional args */
function checkSqlReport(
  original: LegacyReportConfig,
  doc: LegacyReportConfig,
): LegacyCheck {
  if (
    !isNonEmptyArray(doc.reportDefinition) &&
    (isNonEmpty(original.aggregationDefinition) ||
      isNonEmpty(original.aggregationDefinitions))
  ) {
    return {
      skipReason:
        "its legacy definition is not an SQL query string (or a list of them) and there is no reportDefinition",
    };
  }
  const skipReason = convertPositionalArgs(doc);
  if (skipReason) {
    return { skipReason };
  }
  const aggregationDefinitionsUnused =
    isNonEmptyArray(original.reportDefinition) ||
    typeof original.aggregationDefinition === "string";
  if (
    aggregationDefinitionsUnused &&
    isNonEmpty(original.aggregationDefinitions)
  ) {
    return {
      warning:
        "removed aggregationDefinitions next to an SQL definition (kept the SQL definition)",
    };
  }
  return {};
}

/**
 * Replace the v1 SQL positional `?` placeholders, filled from `neededArgs` in order,
 * by the named `$startDate`/`$endDate` placeholders, and add the report period
 * `transformations` for every query using these named placeholders.
 * @returns why the doc cannot be converted safely, if so
 */
function convertPositionalArgs(doc: LegacyReportConfig): string | undefined {
  const queryItems = collectQueryItems(doc.reportDefinition);
  const placeholders = queryItems.map((item) =>
    findPositionalPlaceholders(item.query),
  );
  const placeholderCount = placeholders.flat().length;
  if (placeholderCount > 0) {
    const skipReason = replacePositionalArgs(doc, queryItems, placeholders);
    if (skipReason) {
      return skipReason;
    }
  }
  addReportPeriodTransformations(doc, queryItems);
  return undefined;
}

function replacePositionalArgs(
  doc: LegacyReportConfig,
  queryItems: { query: string }[],
  placeholders: number[][],
): string | undefined {
  const rewrite = "rewrite the query with $startDate/$endDate placeholders";
  const neededArgs = doc.neededArgs;
  if (!isNonEmptyArray(neededArgs)) {
    return `its query uses positional "?" placeholders without neededArgs; ${rewrite}`;
  }
  const numbered = queryItems.some((item, i) =>
    placeholders[i].some((position) => /\d/.test(item.query[position + 1])),
  );
  if (numbered) {
    return `numbered placeholders like "?1" are not supported; ${rewrite}`;
  }
  const names = neededArgs.map((arg) => REPORT_PERIOD_PLACEHOLDERS.get(arg));
  if (names.some((name) => !name)) {
    return `neededArgs ${JSON.stringify(neededArgs)} are not supported; ${rewrite}`;
  }
  if (queryItems.length !== 1 || placeholders[0].length !== names.length) {
    return `the "?" placeholders cannot be matched to neededArgs ${JSON.stringify(neededArgs)}; ${rewrite}`;
  }

  const item = queryItems[0];
  let query = item.query;
  for (let i = placeholders[0].length - 1; i >= 0; i--) {
    const position = placeholders[0][i];
    query =
      query.slice(0, position) + "$" + names[i] + query.slice(position + 1);
  }
  item.query = query;
  return undefined;
}

/**
 * Add the report period `transformations` that a query with `$startDate`/`$endDate` needs,
 * keeping any other (or already configured) transformations; the same rule as the Admin UI.
 */
function addReportPeriodTransformations(
  doc: LegacyReportConfig,
  queryItems: { query: string }[],
) {
  if (!queryItems.some((item) => /\$startDate|\$endDate/.test(item.query))) {
    return;
  }
  doc.transformations = {
    ...REPORT_PERIOD_TRANSFORMATIONS,
    ...doc.transformations,
  };
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

function isQueryStringList(value: unknown): value is string[] {
  return (
    isNonEmptyArray(value) && value.every((query) => typeof query === "string")
  );
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
