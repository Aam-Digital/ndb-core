import type * as Sentry from "@sentry/angular";
import { ErrorClassification, isTypedErrorName } from "./error-classification";
import { classifyReportedError } from "./uncaught-error-classification";
import { LoggedError, NamedError } from "./reported-errors";
import { errorText, textOf } from "#src/app/utils/backend-response";

/**
 * Set a grouping fingerprint (and a matching title) where Sentry's default
 * grouping by stack trace would split one problem into many issues.
 * Summarized in the logging README ("How events are grouped and filtered");
 * the rules are documented on the functions below.
 *
 * @param classification of the event's error chain (see `classifyErrorChain`)
 */
export function groupSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
  classification?: ErrorClassification,
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
  const errors = errorsOfExceptions(values, original);
  const chainClassifications = errors
    ? errors.map((error) => classifyReportedError(error))
    : values.map(classifyException);
  const reportedError =
    original instanceof NamedError || original instanceof LoggedError
      ? thrown
      : rewrappedNamedError(values, original);

  if (reportedError) {
    const failedRequest = failedRequestPassedOn(
      reportedError,
      values,
      chainClassifications,
      original,
    );
    if (!failedRequest) {
      return groupByRootCause(
        event,
        values,
        chainClassifications,
        reportedError,
        rootCauseIndex(values, errors),
      );
    }
    if (original instanceof LoggedError) {
      event.tags = {
        ...event.tags,
        logged_message: truncateTag(normalizeErrorValue(thrown.value)),
      };
    }
    return groupAsNetworkError(event, thrown, failedRequest);
  }

  if (classification === "connectivity") {
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
 * The error objects of the event's exceptions (innermost first, like `values`),
 * if Sentry's exceptions are their `cause` chain; else (e.g. an event without
 * the original error) `undefined`, to judge by the serialized exceptions.
 */
function errorsOfExceptions(
  values: Sentry.Exception[],
  original: unknown,
): Error[] | undefined {
  const errors: Error[] = [];
  for (
    let error = original;
    error instanceof Error && errors.length < values.length;
    error = error.cause
  ) {
    errors.unshift(error);
  }
  return errors.length === values.length && !(errors[0]?.cause instanceof Error)
    ? errors
    : undefined;
}

/**
 * The index of the root cause: the innermost of our typed errors, as the foreign
 * error a boundary converted into it (its `cause`) only details it; else the
 * innermost exception.
 */
function rootCauseIndex(
  values: Sentry.Exception[],
  errors: Error[] | undefined,
): number {
  const index = errors
    ? errors.findIndex((error) => isTypedErrorName(error.name))
    : values.findIndex((value) => isTypedErrorName(value.type));
  return Math.max(index, 0);
}

/** The classification of an exception as Sentry serialized it, without the error object. */
export function classifyException(
  exception: Sentry.Exception,
): ErrorClassification | undefined {
  return classifyReportedError({
    name: exception.type,
    message: exception.value ?? "",
  });
}

/** Whether nothing caught the reported error: it reached Angular's `ErrorHandler` or the window. */
export function isUnhandled(event: Sentry.ErrorEvent): boolean {
  return event.exception?.values?.at(-1)?.mechanism?.handled === false;
}

/**
 * The failed request that our error only passes on, if that is all it reports:
 * a `DatabaseException` that is a connectivity failure itself, or one logged
 * with a message (whatever component logged it, it is the same dropped connection).
 */
function failedRequestPassedOn(
  reportedError: Sentry.Exception,
  values: Sentry.Exception[],
  chainClassifications: (ErrorClassification | undefined)[],
  original: unknown,
): Sentry.Exception | undefined {
  if (chainClassifications[values.indexOf(reportedError)] === "connectivity") {
    return reportedError;
  }
  if (!(original instanceof LoggedError)) {
    return undefined;
  }
  if (!(original.cause instanceof Error)) {
    return loggedForeignFailedRequest(original.cause);
  }
  const causeIndex = values.length - 2;
  return causeIndex >= 0 && chainClassifications[causeIndex] === "connectivity"
    ? values[causeIndex]
    : undefined;
}

/**
 * A logged failure that is not an `Error` (e.g. an `HttpErrorResponse` of a request
 * to another service without response), which Sentry does not serialize as an
 * exception of the event: as the exception it would be, if it is a failed request.
 */
function loggedForeignFailedRequest(
  cause: unknown,
): Sentry.Exception | undefined {
  if (classifyReportedError(cause) !== "connectivity") {
    return undefined;
  }
  const { name, message } = (cause ?? {}) as Record<string, unknown>;
  return {
    type: textOf(name) || "Error",
    value: textOf(message) || errorText(cause),
  };
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
 * Group one failure into one issue.
 *
 * A wrapped error chain is grouped by its root cause alone (with the component's
 * message as the `reported_by` tag) only if the root cause is a classified failure
 * that means the same whichever component ran into it: a broken local database,
 * a server fault, a missing permission. All other chains are grouped by the wrapper
 * and the root cause: a generic root cause (e.g. a `missing` document or a
 * `TypeError`) in another component is likely a different bug and gets an issue
 * (and new-issue alert) of its own.
 * A network failure is grouped by the wrapper as well, as the wrapper says what
 * could not be done (e.g. `AppBootstrapError` caused by a failed request).
 *
 * `values` are ordered innermost-first: `values[0]` is the root cause.
 */
function groupByRootCause(
  event: Sentry.ErrorEvent,
  values: Sentry.Exception[],
  chainClassifications: (ErrorClassification | undefined)[],
  reportedError: Sentry.Exception,
  rootIndex: number,
): Sentry.ErrorEvent {
  const reportedIndex = values.indexOf(reportedError);
  const reportedKey = [
    reportedError.type ?? "",
    groupingValue(reportedError, chainClassifications[reportedIndex]),
  ];
  const rootPosition = Math.min(rootIndex, reportedIndex);
  const rootCause = values[rootPosition];
  const rootClassification = chainClassifications[rootPosition];
  const rootKey = [
    rootCause.type ?? "",
    groupingValue(rootCause, rootClassification),
  ];
  // Sentry titles an event by its thrown error
  const thrown = values[values.length - 1];

  // a wrapper repeating its cause's type and message is one failure, not two
  if (rootCause === reportedError || rootKey.join() === reportedKey.join()) {
    event.fingerprint = reportedKey;
    thrown.type = reportedError.type;
    thrown.value = reportedError.value;
    return event;
  }
  // as is one passing on the classification of the typed error it wraps (a DatabaseException)
  if (
    rootClassification &&
    chainClassifications[reportedIndex] === rootClassification
  ) {
    event.fingerprint = rootKey;
    thrown.type = rootCause.type;
    thrown.value = normalizeErrorValue(rootCause.value);
    return event;
  }

  if (!rootClassification || rootClassification === "connectivity") {
    const rootText =
      rootClassification === "connectivity"
        ? NETWORK_FAILURE
        : normalizeErrorValue(rootCause.value);
    event.fingerprint = [...reportedKey, ...rootKey];
    thrown.type = reportedError.type;
    thrown.value = `${reportedError.value} (caused by ${rootCause.type ?? "Error"}: ${rootText})`;
    return event;
  }

  event.fingerprint = rootKey;
  const reportedBy = `${reportedError.type ?? "Error"}: ${normalizeErrorValue(reportedError.value)}`;
  event.tags = { ...event.tags, reported_by: truncateTag(reportedBy) };
  event.extra = { ...event.extra, reported_by: reportedBy };
  thrown.type = rootCause.type;
  thrown.value = normalizeErrorValue(rootCause.value);
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
  event.fingerprint = [NETWORK_ERROR_FINGERPRINT];
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

/** The fingerprint of the one issue collecting all connectivity failures. */
export const NETWORK_ERROR_FINGERPRINT = "network-error";

/** Stands in for a connectivity failure, which every browser words differently. */
const NETWORK_FAILURE = "network failure";

function groupingValue(
  exception: Sentry.Exception,
  classification: ErrorClassification | undefined,
): string {
  return classification === "connectivity"
    ? NETWORK_FAILURE
    : fingerprintKey(exception.value);
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
export function truncateTag(value: string): string {
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

/** A path segment naming a route rather than a record: a word (e.g. `_bulk_docs`) or an API version. */
const ROUTE_PATH_SEGMENT = /^(_?[a-z][a-z_-]*|v\d+)$/i;

/**
 * The path of a request as a grouping key: without host, query and fragment
 * (which may hold personal data), and with every segment that is not a route
 * name masked (document ids, uuids, numbers),
 * e.g. "/db/app/Child%3A1?rev=1-a" → "/db/app/<id>".
 */
export function normalizeRequestPath(url: string): string {
  const path = url.replace(/^[a-z]+:\/\/[^/]*/i, "").split(/[?#]/)[0];
  return path
    .split("/")
    .map((segment) =>
      segment === "" || ROUTE_PATH_SEGMENT.test(segment) ? segment : "<id>",
    )
    .join("/");
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
