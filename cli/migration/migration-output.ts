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

export function printOutcomes(
  outcomes: OrgOutcome<MigrationOutcome>[],
  showWriteStats: boolean,
  verbose = false,
): void {
  console.log("\n── Summary: Status per org ──");
  for (const {
    org,
    result: { result, writeStats },
  } of outcomes) {
    process.stdout.write(`  ${OrgRunner.orgLabel(org).padEnd(50)}`);
    const suffix =
      showWriteStats && writeStats.intended > 0
        ? `  (${writeStats.succeeded}/${writeStats.intended} written)`
        : "";
    const STATUS_TAGS: Record<MigrationResult["status"], string> = {
      ok: "OK       ",
      "no-change": "NO-CHANGE",
      "dry-run": "PREVIEW  ",
      partial: "PARTIAL  ",
      failed: "FAILED   ",
    };
    console.log((STATUS_TAGS[result.status] ?? result.status) + suffix);
    if (result.warnings?.length) {
      result.warnings.forEach((w) => console.log(`    ! ${w}`));
    }
    if (verbose && result.details) {
      String(result.details)
        .split("\n")
        .forEach((line) => console.log(`    ${line}`));
    }
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
    `Summary: ${counts.ok} changed, ${counts.noChange} no-change, ${counts.partial} partial, ${counts.failed} failed`,
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
