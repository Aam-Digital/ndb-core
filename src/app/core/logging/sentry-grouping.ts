import type * as Sentry from "@sentry/angular";
import { classifyError, ErrorClassification } from "./error-classification";
import { LoggedError, NamedError } from "./reported-errors";

/**
 * Set a grouping fingerprint (and a matching title) where Sentry's default
 * grouping by stack trace would split one problem into many issues.
 * The rules are explained in the logging README ("How events are grouped").
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
  const links = classifyExceptions(values, original);
  const ours =
    original instanceof NamedError || original instanceof LoggedError
      ? thrown
      : rewrappedNamedError(values, original);

  if (ours) {
    const failedRequest = failedRequestPassedOn(ours, values, links, original);
    if (!failedRequest) {
      return groupByRootCause(event, values, links, ours);
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
 * The classification of each exception of the event (innermost first, like `values`).
 *
 * Taken from the error objects where Sentry's exceptions are their `cause` chain;
 * else (e.g. an event without the original error) from the serialized exception.
 */
function classifyExceptions(
  values: Sentry.Exception[],
  original: unknown,
): (ErrorClassification | undefined)[] {
  const errors: Error[] = [];
  for (
    let error = original;
    error instanceof Error && errors.length < values.length;
    error = error.cause
  ) {
    errors.unshift(error);
  }
  if (errors.length === values.length && !(errors[0]?.cause instanceof Error)) {
    return errors.map((error) => classifyError(error));
  }
  return values.map((exception) =>
    classifyError({ name: exception.type, message: exception.value ?? "" }),
  );
}

/**
 * The failed request that our error only passes on, if that is all it reports:
 * a `DatabaseException` that is a connectivity failure itself, or one logged
 * with a message (whatever component logged it, it is the same dropped connection).
 */
function failedRequestPassedOn(
  ours: Sentry.Exception,
  values: Sentry.Exception[],
  links: (ErrorClassification | undefined)[],
  original: unknown,
): Sentry.Exception | undefined {
  if (links[values.indexOf(ours)] === "connectivity") {
    return ours;
  }
  const causeIndex = values.length - 2;
  return original instanceof LoggedError &&
    causeIndex >= 0 &&
    links[causeIndex] === "connectivity"
    ? values[causeIndex]
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
 * Errors whose message does not tell where the bug is ("x is undefined"):
 * as a root cause, they are told apart by the function that threw them.
 */
const PROGRAMMING_ERROR_TYPES = [
  "TypeError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "EvalError",
  "URIError",
];

/**
 * Group one failure into one issue, whichever component wrapped and logged it:
 * by its root cause, with the component's message as the `reported_by` tag.
 *
 * Exceptions to grouping by the root cause alone:
 * - a programming error (`TypeError`, ...) also by the function that threw it,
 *   or by the wrapper if that is unknown, as its message is not specific to one bug;
 * - a network failure (e.g. `AppBootstrapError` caused by a failed request) by the
 *   wrapper as well, as the wrapper says what could not be done.
 *
 * `values` are ordered innermost-first: `values[0]` is the root cause.
 */
function groupByRootCause(
  event: Sentry.ErrorEvent,
  values: Sentry.Exception[],
  links: (ErrorClassification | undefined)[],
  ours: Sentry.Exception,
): Sentry.ErrorEvent {
  const oursIndex = values.indexOf(ours);
  const oursKey = [ours.type ?? "", groupingValue(ours, links[oursIndex])];
  const rootCause = values[0];
  const rootKey = [rootCause.type ?? "", groupingValue(rootCause, links[0])];
  // Sentry titles an event by its thrown error
  const thrown = values[values.length - 1];

  // a wrapper repeating its cause's type and message is one failure, not two
  if (rootCause === ours || rootKey.join() === oursKey.join()) {
    event.fingerprint = oursKey;
    thrown.type = ours.type;
    thrown.value = ours.value;
    return event;
  }

  if (links[0] === "connectivity") {
    event.fingerprint = [...oursKey, ...rootKey];
    thrown.type = ours.type;
    thrown.value = `${ours.value} (caused by ${rootCause.type ?? "Error"}: ${NETWORK_FAILURE})`;
    return event;
  }

  event.fingerprint = rootKey;
  if (PROGRAMMING_ERROR_TYPES.includes(rootCause.type ?? "")) {
    const location = throwingFunction(rootCause);
    event.fingerprint.push(...(location ? [location] : oursKey));
  }

  const reportedBy = `${ours.type ?? "Error"}: ${normalizeErrorValue(ours.value)}`;
  event.tags = { ...event.tags, reported_by: truncateTag(reportedBy) };
  event.extra = { ...event.extra, reported_by: reportedBy };
  thrown.type = rootCause.type;
  thrown.value = normalizeErrorValue(rootCause.value);
  return event;
}

/**
 * The name of the function that threw the error: the innermost stack frame
 * with a name that survives minification (a method name, not `t` or `<anonymous>`),
 * so that it is the same in every release.
 */
function throwingFunction(exception: Sentry.Exception): string | undefined {
  const frames = exception.stacktrace?.frames ?? [];
  for (let i = frames.length - 1; i >= 0; i--) {
    const name = frames[i].function?.split(".").pop();
    if (name && name.length > 2 && !name.includes("<anonymous>")) {
      return name;
    }
  }
  return undefined;
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
