import { color } from "../lib/colors.js";
import { type OrgOutcome, OrgRunner } from "../lib/org-runner.js";
import type {
  MigrationDefinition,
  MigrationOutcome,
  MigrationResult,
} from "./migration-definition.js";

export function printBanner(
  label: string,
  migration: MigrationDefinition,
): void {
  console.log(
    `\n${"─".repeat(60)}\n${label}  ${migration.id}: ${migration.description}\n${"─".repeat(60)}`,
  );
}

const STATUS_TAGS: Record<MigrationResult["status"], string> = {
  ok: "OK       ",
  "no-change": "NO-CHANGE",
  "dry-run": "PREVIEW  ",
  partial: "PARTIAL  ",
  failed: "FAILED   ",
};

const STATUS_COLORS: Record<
  MigrationResult["status"],
  Parameters<typeof color>[0]
> = {
  ok: "green",
  "no-change": "blue",
  "dry-run": "cyan",
  partial: "yellow",
  failed: "red",
};

/** Prints a single org's outcome line (plus warnings/details), as each org is processed. */
export function printOutcome(
  { org, result: { result, writeStats } }: OrgOutcome<MigrationOutcome>,
  showWriteStats: boolean,
  verbose = false,
): void {
  // pad before coloring: escape codes would otherwise count towards the width
  process.stdout.write(
    `  ${color("bold", OrgRunner.orgLabel(org).padEnd(50))}`,
  );
  const suffix =
    showWriteStats && writeStats.intended > 0
      ? `  (${writeStats.succeeded}/${writeStats.intended} written)`
      : "";
  const tag = STATUS_TAGS[result.status] ?? result.status;
  console.log(color(STATUS_COLORS[result.status] ?? "white", tag) + suffix);
  if (result.warnings?.length) {
    result.warnings.forEach((w) => console.log(color("yellow", `    ! ${w}`)));
  }
  if (verbose && result.details) {
    String(result.details)
      .split("\n")
      .forEach((line) => console.log(`    ${line}`));
  }
}

export function printSummary(
  outcomes: OrgOutcome<MigrationOutcome>[],
  unreachableCount: number,
): void {
  const counts = { ok: 0, noChange: 0, partial: 0, failed: 0 };
  for (const {
    result: { result },
  } of outcomes) {
    if (result.status === "ok" || result.status === "dry-run") counts.ok++;
    else if (result.status === "no-change") counts.noChange++;
    else if (result.status === "partial") counts.partial++;
    else if (result.status === "failed") counts.failed++;
  }
  counts.failed += unreachableCount;

  console.log("\n" + "─".repeat(60));
  console.log(
    "Summary: " +
      [
        counts.ok > 0
          ? color("green", `${counts.ok} changed`)
          : `${counts.ok} changed`,
        `${counts.noChange} no-change`,
        counts.partial > 0
          ? color("yellow", `${counts.partial} partial`)
          : `${counts.partial} partial`,
        counts.failed > 0
          ? color("red", `${counts.failed} failed`)
          : `${counts.failed} failed`,
      ].join(", "),
  );
  console.log("─".repeat(60) + "\n");
}

export function computeExitCode(
  outcomes: OrgOutcome<MigrationOutcome>[],
  unreachableCount: number,
): number {
  if (unreachableCount > 0) return 1;
  for (const {
    result: { result },
  } of outcomes) {
    if (result.status === "failed" || result.status === "partial") return 1;
  }
  return 0;
}
