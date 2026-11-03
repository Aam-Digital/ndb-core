import type * as Sentry from "@sentry/angular";
import {
  classifyErrorChain,
  causeChain,
  ErrorClassification,
  isTypedErrorName,
} from "./error-classification";
import { classifyReportedError } from "./uncaught-error-classification";
import {
  classifyException,
  groupSentryEvent,
  isUnhandled,
} from "./sentry-grouping";
import { NamedError } from "./reported-errors";
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
  if (policy?.drop?.()) {
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
const REPORTING_POLICY: Partial<
  Record<
    ErrorClassification,
    {
      /** whether nobody can act on it: not reported at all */
      drop?: () => boolean;
      /** changes to the event after grouping */
      adjust?: (event: Sentry.ErrorEvent) => void;
    }
  >
> = {
  // into the shared `network-error` issue at level warning (see `groupSentryEvent`),
  // once per page load (see `reportOnce`); while offline it is expected
  connectivity: { drop: () => !navigator.onLine },
  // the user is told; the code waiting for the data is not at fault
  "session-expired": { drop: () => true },
  // a caught one is logged at debug (see `isExpectedFailure`): this one was not
  // handled or is wrapped in a named error, usually a permission-configuration
  // state (e.g. a public form failing on every submission because the public role
  // may not create the record)
  "not-permitted": { adjust: (event) => (event.level = "warning") },
  // normal for an offline-first app: the user is told by the form and it is
  // counted in usage analytics instead
  "write-conflict": { drop: () => true },
  // one incident per page load (see `report-once.ts`)
  "local-storage": {
    adjust: (event) => (event.tags = { ...event.tags, incident: "local-db" }),
  },
};

/**
 * The classification of the failure an event reports: of its error chain if the
 * error object is known, else by the reported exceptions. Foreign errors that
 * reached the logging unconverted are recognized as well (see
 * `uncaught-error-classification.ts`). An event of a logged message (or a thrown
 * string) is not classified: a message is not classified by its wording.
 */
function classifySentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): ErrorClassification | undefined {
  const original = hint?.originalException;
  if (typeof original === "string") {
    return undefined;
  }
  const classification = classifyErrorChain(original, classifyReportedError);
  if (classification || original instanceof Error) {
    return classification;
  }
  return event.exception?.values?.map(classifyException).find(Boolean);
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
