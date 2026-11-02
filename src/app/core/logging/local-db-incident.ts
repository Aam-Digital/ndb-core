import type * as Sentry from "@sentry/angular";
import type { ErrorClassification } from "./reported-errors";

/**
 * A broken local database is one incident per page load, not one issue per
 * component that runs into it.
 *
 * Once the device's IndexedDB is broken (the `local-storage` classification:
 * `indexed_db_went_bad`, "database connection is closing", "object store was not
 * found", an "Incorrect adapter", multi-tab corruption - the list is in
 * `error-classification.ts`), every later database access of the page load fails
 * as well: loading the config, the permission rules, the sync, each view.
 * The first such event is reported, tagged `incident: local-db`; the others only
 * as breadcrumbs of later events.
 */
let localDbIncidentReported = false;

/**
 * Whether the event only follows up on a local database failure already reported
 * in this page load. Tags the event if it is the first one.
 */
export function isFollowUpOfLocalDbIncident(
  event: Sentry.ErrorEvent,
  classification: ErrorClassification | undefined,
): boolean {
  if (classification !== "local-storage") {
    return false;
  }
  if (localDbIncidentReported) {
    return true;
  }
  localDbIncidentReported = true;
  event.tags = { ...event.tags, incident: "local-db" };
  return false;
}

/** For tests: start a new page load. */
export function resetLocalDbIncident() {
  localDbIncidentReported = false;
}
