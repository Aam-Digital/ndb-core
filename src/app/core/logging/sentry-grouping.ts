import type * as Sentry from "@sentry/angular";
import {
  CONNECTIVITY_ERROR_NAMES,
  CONNECTIVITY_ERROR_STATUS,
  isConnectivityErrorMessage,
} from "#src/app/utils/connectivity-error";
import { LoggedError, NamedError } from "./reported-errors";

/**
 * Set a grouping fingerprint (and a matching title) where Sentry's default
 * grouping by stack trace would split one problem into many issues.
 * The rules are explained in the logging README ("How events are grouped").
 */
export function groupSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent {
  const values = event.exception?.values;
  if (!values?.length) {
    if (event.message) {
      event.fingerprint = [fingerprintKey(event.message)];
    }
    return event;
  }

  const thrown = values[values.length - 1];
  const original = hint?.originalException;
  const ours =
    original instanceof NamedError || original instanceof LoggedError
      ? thrown
      : rewrappedNamedError(values, original);

  if (ours) {
    const failedRequest = failedRequestPassedOn(ours, values, original);
    if (!failedRequest) {
      return groupByErrorChain(event, values, ours);
    }
    if (original instanceof LoggedError) {
      event.tags = {
        ...event.tags,
        logged_message: truncateTag(normalizeErrorValue(thrown.value)),
      };
    }
    return groupAsNetworkError(event, thrown, failedRequest);
  }

  if (isConnectivityFailure(event)) {
    return groupAsNetworkError(event, thrown);
  }

  if (!values.some((v) => v.stacktrace?.frames?.length)) {
    // without a stack Sentry groups by the raw message: one issue per id or url
    event.fingerprint = [thrown.type || "Error", fingerprintKey(thrown.value)];
    reportNormalized(event, thrown);
  }
  return event;
}

/**
 * The failed request that our error only passes on, if that is all it reports:
 * a `DatabaseException` that is a connectivity failure itself, or one logged
 * with a message (whatever component logged it, it is the same dropped connection).
 */
function failedRequestPassedOn(
  ours: Sentry.Exception,
  values: Sentry.Exception[],
  original: unknown,
): Sentry.Exception | undefined {
  if (isConnectivityException(ours)) {
    return ours;
  }
  const cause = values[values.length - 2];
  return original instanceof LoggedError &&
    cause &&
    isConnectivityException(cause)
    ? cause
    : undefined;
}

/**
 * One of our errors that a framework wrapped without adding anything but its
 * stack, e.g. Angular re-throwing an error raised in a `resource()` loader.
 */
function rewrappedNamedError(
  values: Sentry.Exception[],
  original: unknown,
): Sentry.Exception | undefined {
  const cause = (original as { cause?: unknown } | undefined)?.cause;
  if (!(cause instanceof NamedError) || values.length < 2) {
    return undefined;
  }
  // `toString()` of the cause gives "Error: <message>"
  const wrapperValue = fingerprintKey(values[values.length - 1].value).replace(
    /^error /,
    "",
  );
  const named = values[values.length - 2];
  return wrapperValue === fingerprintKey(named.value) ? named : undefined;
}

/**
 * Group by the error identifying the problem plus the root cause, which is also
 * appended to the title so that issues split by it can be told apart.
 * `values` are ordered innermost-first: `values[0]` is the root cause.
 */
function groupByErrorChain(
  event: Sentry.ErrorEvent,
  values: Sentry.Exception[],
  grouped: Sentry.Exception,
): Sentry.ErrorEvent {
  const fingerprint = [grouped.type ?? "", groupingValue(grouped)];

  const rootCause = values[0];
  if (rootCause !== grouped) {
    const rootFingerprint = [rootCause.type ?? "", groupingValue(rootCause)];
    // a wrapper repeating its cause's type and message is one failure, not two
    if (rootFingerprint.join() !== fingerprint.join()) {
      fingerprint.push(...rootFingerprint);
      grouped.value = `${grouped.value} ${describeCause(rootCause)}`;
    }
  }

  // Sentry titles an event by its thrown error
  const thrown = values[values.length - 1];
  thrown.type = grouped.type;
  thrown.value = grouped.value;

  event.fingerprint = fingerprint;
  return event;
}

/**
 * Collect every "could not reach the server" into one issue, at level warning:
 * it usually is one device's connection, and an outage shows as this issue rising.
 * The browser-specific wording is replaced by a stable title and kept as a tag.
 */
function groupAsNetworkError(
  event: Sentry.ErrorEvent,
  thrown: Sentry.Exception,
  failedRequest: Sentry.Exception = thrown,
): Sentry.ErrorEvent {
  event.fingerprint = ["network-error"];
  event.level = "warning";
  event.tags = {
    ...event.tags,
    network_error: truncateTag(
      `${failedRequest.type ?? "Error"}: ${normalizeErrorValue(failedRequest.value)}`,
    ),
  };
  event.extra = { ...event.extra, originalError: failedRequest.value };

  thrown.type = "NetworkError";
  thrown.value = "Failed to reach the server";
  return event;
}

/**
 * Whether the event is a request that never reached the server: by any link of
 * its error chain, by a gateway status, or by its message.
 */
export function isConnectivityFailure(event: Sentry.ErrorEvent): boolean {
  const status = event.extra?.status;
  return (
    !!event.exception?.values?.some(isConnectivityException) ||
    (typeof status === "number" &&
      CONNECTIVITY_ERROR_STATUS.includes(status)) ||
    (!!event.message && isConnectivityErrorMessage(event.message))
  );
}

function isConnectivityException(exception: Sentry.Exception): boolean {
  return (
    CONNECTIVITY_ERROR_NAMES.includes(exception.type ?? "") ||
    isConnectivityErrorMessage(exception.value ?? "")
  );
}

/** Stands in for a connectivity failure, which every browser words differently. */
const NETWORK_FAILURE = "network failure";

function groupingValue(exception: Sentry.Exception): string {
  return isConnectivityException(exception)
    ? NETWORK_FAILURE
    : fingerprintKey(exception.value);
}

function describeCause(rootCause: Sentry.Exception): string {
  const cause = isConnectivityException(rootCause)
    ? NETWORK_FAILURE
    : normalizeErrorValue(rootCause.value);
  return `(caused by ${rootCause.type ?? "Error"}: ${cause})`;
}

/**
 * Report an exception under its normalized message, which is its grouping key
 * here, keeping the original as extra data (an id per row, or a quoted HTML
 * error page, would otherwise be the issue title).
 */
function reportNormalized(
  event: Sentry.ErrorEvent,
  exception: Sentry.Exception,
) {
  if (!exception.value) {
    return;
  }
  const normalized = normalizeErrorValue(exception.value).slice(0, 300);
  if (normalized !== exception.value) {
    event.extra = { ...event.extra, originalError: exception.value };
    exception.value = normalized;
  }
}

/** Sentry rejects tag values longer than 200 characters. */
function truncateTag(value: string): string {
  return value.slice(0, 200);
}

/**
 * Values that vary between occurrences of one problem, masked before a message
 * is used as a grouping key. The more specific patterns have to run first.
 */
const VOLATILE_VALUE_PATTERNS: [RegExp, string][] = [
  // a response body quoted into the message, e.g. an error page of the proxy
  [/ with body ["'][\s\S]*$/i, ""],
  [/https?:\/\/\S+/gi, "<url>"],
  [
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "<uuid>",
  ],
  [/\b\d+-[0-9a-f]{32}\b/gi, "<rev>"],
  // legacy entity ids embedding a username (`User:some.person`); not "TypeError: ..."
  [/\b[A-Z][A-Za-z]{2,}:[A-Za-z0-9._<>-]+/g, "<entityId>"],
  [/\d+/g, "<n>"],
];

/** Mask ids, urls and numbers, staying human-readable for titles. */
export function normalizeErrorValue(value: string | undefined): string {
  if (!value) {
    return "<none>";
  }
  return VOLATILE_VALUE_PATTERNS.reduce(
    (normalized, [pattern, placeholder]) =>
      normalized.replace(pattern, placeholder),
    value,
  );
}

/**
 * Reduce a message to a grouping key: normalized, and without the casing and
 * punctuation that libraries are inconsistent about ("Unauthorized"/"unauthorized").
 */
export function fingerprintKey(value: string | undefined): string {
  return normalizeErrorValue(value)
    .toLowerCase()
    .replace(/[.,;:!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
