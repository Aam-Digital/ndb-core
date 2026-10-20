import type * as Sentry from "@sentry/angular";
import { HttpStatusCode } from "@angular/common/http";
import { isExpiredSessionError } from "#src/app/utils/expired-session-error";
import {
  fingerprintKey,
  groupSentryEvent,
  isConnectivityFailure,
} from "./sentry-grouping";
import { NamedError } from "./reported-errors";

/**
 * Sentry `beforeSend` hook: adds structured details, drops events nobody can act
 * on, sets the grouping fingerprint and caps repeats per issue.
 * See the logging README for the reasoning behind each step.
 */
export function processSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent | null {
  enrichSentryEvent(event, hint);

  if (
    (!navigator.onLine && isConnectivityFailure(event)) ||
    isDocumentUpdateConflict(event) ||
    isUnhandledErrorInPageScript(event) ||
    causeChain(hint?.originalException).some(isExpiredSessionError)
  ) {
    return null;
  }

  // grouping first, as the repeat cap is per issue
  groupSentryEvent(event, hint);
  return isExcessiveRepeat(event) ? null : event;
}

/**
 * A rejected write with an outdated revision: normal for an offline-first app,
 * the user is told by the form and it is counted in usage analytics instead.
 * The status is not always preserved, so PouchDB's wording counts as well.
 */
function isDocumentUpdateConflict(event: Sentry.ErrorEvent): boolean {
  return (
    event.extra?.status === HttpStatusCode.Conflict ||
    [event.message, ...(event.exception?.values?.map((v) => v.value) ?? [])]
      .filter(Boolean)
      .some((msg) => fingerprintKey(msg).includes("document update conflict"))
  );
}

/**
 * An unhandled error raised only by code inlined into the HTML page itself, not by any of our
 * script files: e.g. a script injected by an in-app browser (seen from the iOS Google app).
 * Our own code is always loaded from `.js` files, so nobody here can act on such an error.
 */
function isUnhandledErrorInPageScript(event: Sentry.ErrorEvent): boolean {
  const exception = event.exception?.values?.at(-1);
  if (exception?.mechanism?.handled !== false) {
    return false;
  }
  const frames = exception.stacktrace?.frames ?? [];
  return (
    frames.length > 0 &&
    frames.every(
      (frame) =>
        /^(https?:\/\/[^/]+)?\//.test(frame.filename ?? "") &&
        !/\.m?js([?#]|$)/.test(frame.filename),
    )
  );
}

/** The error and the `cause`s it wraps, outermost first (cycle-safe, max 6 levels). */
function causeChain(error: unknown): object[] {
  const chain: object[] = [];
  let current = error;
  while (
    current &&
    typeof current === "object" &&
    !chain.includes(current) &&
    chain.length <= 5
  ) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
}

const REPORTED_ERROR_PROPERTIES = [
  "entityId",
  "status",
  "reason",
  "name",
  "action",
  "entityType",
];

/**
 * Report properties of the error as extra data (e.g. a DatabaseException's
 * status and reason). The cause chain is searched outermost first, as a wrapper
 * naming the failed operation usually has none of these itself.
 */
function enrichSentryEvent(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
  const details: Record<string, unknown> = {};
  for (const error of causeChain(hint?.originalException) as Record<
    string,
    any
  >[]) {
    for (const key of REPORTED_ERROR_PROPERTIES) {
      details[key] ??= error[key];
    }
    // keycloak-js passes on the whole `fetch` Response instead of the status
    if (typeof error.response?.status === "number") {
      details.status ??= error.response.status;
    }
    if (error instanceof NamedError) {
      Object.assign(details, error.details);
    }
  }

  const defined = Object.entries(details).filter(([, v]) => v !== undefined);
  if (defined.length > 0) {
    event.extra = { ...event.extra, ...Object.fromEntries(defined) };
  }

  // Sentry lists an exception without a type as "<unknown>"
  for (const exception of event.exception?.values ?? []) {
    exception.type ||= "Error";
  }
}

/**
 * How often an issue is reported per page load, against error loops (e.g. an
 * error on every change detection) flooding monitoring and the quota.
 */
export const MAX_REPEATED_SENTRY_EVENTS = 5;

const sentryEventCounts = new Map<string, number>();

/** Exported for tests, which would otherwise share one budget. */
export function resetSentryEventCounts() {
  sentryEventCounts.clear();
}

function isExcessiveRepeat(event: Sentry.ErrorEvent): boolean {
  const key = repeatKey(event);
  const count = (sentryEventCounts.get(key) ?? 0) + 1;
  sentryEventCounts.set(key, count);
  return count > MAX_REPEATED_SENTRY_EVENTS;
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
  const values = event.exception?.values;
  const thrown = values?.[values.length - 1];
  return thrown
    ? JSON.stringify(["exception", thrown.type, fingerprintKey(thrown.value)])
    : JSON.stringify(["message", fingerprintKey(event.message)]);
}
