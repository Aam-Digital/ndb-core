import type * as Sentry from "@sentry/angular";
import {
  classifyError,
  classifyErrorChain,
  causeChain,
  ErrorClassification,
  isTypedErrorName,
} from "./error-classification";
import {
  classifyException,
  groupSentryEvent,
  isUnhandled,
  truncateTag,
} from "./sentry-grouping";
import { LoggedError, NamedError } from "./reported-errors";
import { reportOnce } from "./report-once";

/**
 * Sentry `beforeSend` hook: adds structured details, drops events nobody can act
 * on, sets the grouping fingerprint and reports each failure once per page load.
 * See the logging README for the reasoning behind each step.
 */
export function processSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent | null {
  enrichSentryEvent(event, hint);
  if (isUnhandledErrorInPageScript(event)) {
    return null;
  }

  const classification = classifySentryEvent(event, hint);
  const policy = classification ? REPORTING_POLICY[classification] : undefined;
  if (policy?.drop?.(hint, event)) {
    return null;
  }
  if (classification) {
    event.tags = { ...event.tags, error_class: classification };
  }

  // grouping first, as the repeat cap is per issue
  groupSentryEvent(event, hint, classification);
  policy?.adjust?.(event);
  return reportOnce(event, hint, classification);
}

/**
 * What is done with an event by the classification of the failure it reports
 * (see `error-classification.ts`). Failures without a classification are
 * reported as they are, grouped as described in the README.
 */
const REPORTING_POLICY: Record<
  ErrorClassification,
  {
    /** whether nobody can act on it: not reported at all */
    drop?: (hint: Sentry.EventHint, event: Sentry.ErrorEvent) => boolean;
    /** changes to the event after grouping */
    adjust?: (event: Sentry.ErrorEvent) => void;
  }
> = {
  // into the shared `network-error` issue at level warning (see `groupSentryEvent`),
  // once per page load (see `reportOnce`); while offline it is expected
  connectivity: { drop: () => !navigator.onLine },
  // the user is told; the code waiting for the data is not at fault
  "session-expired": { drop: () => true },
  // usually a permission-configuration state, not a bug: reported (as a warning)
  // where a component deliberately logged it with a message of its own, or where
  // nothing handled it (e.g. a public form failing on every submission because
  // the public role may not create the record)
  "not-permitted": {
    drop: (hint, event) =>
      !isUnhandled(event) && !isDeliberatelyLogged(hint?.originalException),
    adjust: (event) => (event.level = "warning"),
  },
  // normal for an offline-first app: the user is told by the form and it is
  // counted in usage analytics instead
  "write-conflict": { drop: () => true },
  // one incident per page load (see `report-once.ts`)
  "local-storage": {
    adjust: (event) => (event.tags = { ...event.tags, incident: "local-db" }),
  },
  // a fault of our backend, whoever logged it: at the level it was logged with
  "server-error": { adjust: reportServerError },
};

/**
 * The classification of the failure an event reports: of its error chain if the
 * error object is known, else (e.g. for an event of a captured message) by the
 * reported exceptions, status and message.
 */
function classifySentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): ErrorClassification | undefined {
  const original = hint?.originalException;
  if (original instanceof Error) {
    return classifyErrorChain(original);
  }
  return (
    classifyErrorChain(original) ??
    event.exception?.values?.map(classifyException).find(Boolean) ??
    classifyError(event.message)
  );
}

/** A failure logged with a message by a component, or wrapped in one of our named errors. */
function isDeliberatelyLogged(error: unknown): boolean {
  return (
    error instanceof LoggedError ||
    (error instanceof NamedError && !classifyError(error))
  );
}

/** Report a server fault with an issue per status. */
function reportServerError(event: Sentry.ErrorEvent) {
  const status = event.extra?.status;
  if (typeof status !== "number") {
    return;
  }
  event.tags = { ...event.tags, http_status: truncateTag(String(status)) };
  if (event.fingerprint?.length) {
    event.fingerprint = [...event.fingerprint, String(status)];
  }
  const thrown = event.exception?.values?.at(-1);
  if (thrown) {
    thrown.value = `${thrown.value} (HTTP ${status})`;
  }
}

/**
 * An unhandled error raised only by code inlined into the HTML page itself, not by any of our
 * script files: e.g. a script injected by an in-app browser (seen from the iOS Google app).
 * Our own code is always loaded from `.js` files, so nobody here can act on such an error.
 */
function isUnhandledErrorInPageScript(event: Sentry.ErrorEvent): boolean {
  if (!isUnhandled(event)) {
    return false;
  }
  const frames = event.exception.values.at(-1).stacktrace?.frames ?? [];
  return (
    frames.length > 0 &&
    frames.every(
      (frame) =>
        /^(https?:\/\/[^/]+)?\//.test(frame.filename ?? "") &&
        !/\.m?js([?#]|$)/.test(frame.filename),
    )
  );
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
    if (typeof error !== "object") {
      continue;
    }
    for (const key of REPORTED_ERROR_PROPERTIES) {
      details[key] ??= error[key];
    }
    // keycloak-js passes on the whole `fetch` Response instead of the status
    if (typeof error.response?.status === "number") {
      details.status ??= error.response.status;
    }
    // also of a typed error that lost its class (a copy made by PouchDB)
    if (error instanceof NamedError || isTypedErrorName(error.name)) {
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
