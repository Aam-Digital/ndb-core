import * as Sentry from "@sentry/angular";
import type { ErrorClassification } from "./reported-errors";
import { causeChain } from "./error-classification";
import { fingerprintKey, NETWORK_ERROR_FINGERPRINT } from "./sentry-grouping";
import {
  isFollowUpOfLocalDbIncident,
  resetLocalDbIncident,
} from "./local-db-incident";

/**
 * Report each failure once per page load: an event repeating one already reported
 * is turned into a breadcrumb, so that it still shows in the history of later events.
 * See "Each failure is reported once" in the logging README.
 */

/**
 * How often an issue is reported per page load, against error loops (e.g. an
 * error on every change detection) flooding monitoring and the quota.
 */
export const MAX_REPEATED_SENTRY_EVENTS = 5;

/**
 * The connectivity issue only once per page load: when the connection drops,
 * every pending request fails at the same moment.
 */
export const MAX_NETWORK_ERROR_EVENTS = 1;

/** Error objects (and their causes) already part of an event of this page load. */
let reportedErrors = new WeakSet<object>();
const sentryEventCounts = new Map<string, number>();

/** For tests: start a new page load. */
export function resetReportedEvents() {
  reportedErrors = new WeakSet<object>();
  sentryEventCounts.clear();
  resetLocalDbIncident();
}

/**
 * The event, or `null` if it repeats a failure already reported in this page load
 * (then it is kept as a breadcrumb instead).
 */
export function reportOnce(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
  classification: ErrorClassification | undefined,
): Sentry.ErrorEvent | null {
  const original = hint?.originalException;
  const suppressedAs =
    (isAlreadyReported(event, original) && "already reported") ||
    (isFollowUpOfLocalDbIncident(event, classification) &&
      "follow-up of a local database failure") ||
    (isExcessiveRepeat(event) && "repeated too often");

  for (const error of causeChain(original)) {
    if (typeof error === "object") {
      reportedErrors.add(error);
    }
  }

  if (suppressedAs) {
    Sentry.addBreadcrumb({
      category: "sentry.suppressed",
      level: event.level,
      message: describe(event),
      data: { reason: suppressedAs },
    });
    return null;
  }
  return event;
}

/**
 * Whether the error was already part of an event: e.g. logged by a component
 * (wrapped in its message) and then re-thrown to Angular's `ErrorHandler`.
 *
 * Only an unhandled error is dropped for its root cause alone: two components
 * logging the same failure are both reported (grouped into one issue, with
 * their messages as `reported_by` tag).
 */
function isAlreadyReported(
  event: Sentry.ErrorEvent,
  original: unknown,
): boolean {
  const chain = causeChain(original).filter((e) => typeof e === "object");
  if (chain.length === 0) {
    return false;
  }
  if (reportedErrors.has(chain[0])) {
    return true;
  }
  const unhandled =
    event.exception?.values?.at(-1)?.mechanism?.handled === false;
  return unhandled && reportedErrors.has(chain[chain.length - 1]);
}

function isExcessiveRepeat(event: Sentry.ErrorEvent): boolean {
  const key = repeatKey(event);
  const count = (sentryEventCounts.get(key) ?? 0) + 1;
  sentryEventCounts.set(key, count);
  const max =
    event.fingerprint?.[0] === NETWORK_ERROR_FINGERPRINT
      ? MAX_NETWORK_ERROR_EVENTS
      : MAX_REPEATED_SENTRY_EVENTS;
  return count > max;
}

/**
 * The issue an event ends up in, as far as known here: its fingerprint, or for
 * stack-grouped errors the thrown error (without the stack, so that an error
 * loop is capped even where its frames differ).
 */
function repeatKey(event: Sentry.ErrorEvent): string {
  if (event.fingerprint?.length) {
    return JSON.stringify(["fingerprint", ...event.fingerprint]);
  }
  const thrown = event.exception?.values?.at(-1);
  return thrown
    ? JSON.stringify(["exception", thrown.type, fingerprintKey(thrown.value)])
    : JSON.stringify(["message", fingerprintKey(event.message)]);
}

/** The event's title, as Sentry would show it. */
function describe(event: Sentry.ErrorEvent): string {
  const thrown = event.exception?.values?.at(-1);
  return thrown ? `${thrown.type}: ${thrown.value}` : (event.message ?? "");
}
