import { type ConnectivityResult, OrgRunner } from "./org-runner.js";

export function printConnectivity(
  results: ConnectivityResult[],
  verbose = false,
): void {
  console.log(
    `\nConnectivity check (${results.length} org${results.length !== 1 ? "s" : ""})...`,
  );
  for (const { org, reachable, failureReason, errorDetail } of results) {
    const mark = reachable ? "✓" : "✗";
    const suffix = reachable
      ? ""
      : failureReason === "auth"
        ? "  (auth failed)"
        : "  (unreachable)";
    console.log(`  ${mark}  ${OrgRunner.orgLabel(org)}${suffix}`);
    if (verbose && !reachable && errorDetail) {
      console.log(`        ${errorDetail}`);
    }
  }
}
