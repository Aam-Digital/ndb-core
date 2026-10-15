import { color } from "./colors.js";
import { type ConnectivityResult, OrgRunner } from "./org-runner.js";

export function printConnectivity(
  results: ConnectivityResult[],
  verbose = false,
): void {
  console.log(
    `\nConnectivity check (${results.length} org${results.length !== 1 ? "s" : ""})...`,
  );
  for (const { org, reachable, failureReason, errorDetail } of results) {
    const mark = reachable ? color("green", "✓") : color("red", "✗");
    const suffix = reachable
      ? ""
      : color(
          "yellow",
          failureReason === "auth" ? "  (auth failed)" : "  (unreachable)",
        );
    console.log(
      `  ${mark}  ${color("bold", OrgRunner.orgLabel(org))}${suffix}`,
    );
    if (verbose && !reachable && errorDetail) {
      console.log(`        ${errorDetail}`);
    }
  }
}
