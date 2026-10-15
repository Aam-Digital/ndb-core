import { LogLevel } from "./log-level";
import * as Sentry from "@sentry/angular";
import { environment } from "../../../environments/environment";
import {
  ErrorHandler,
  Provider,
  inject,
  provideAppInitializer,
  EnvironmentProviders,
} from "@angular/core";
import { HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import { Router } from "@angular/router";
import { TraceService } from "@sentry/angular";
import {
  CONNECTIVITY_ERROR_NAMES,
  CONNECTIVITY_ERROR_STATUS,
  isConnectivityErrorMessage,
} from "#src/app/utils/connectivity-error";
import { isExpiredSessionError } from "#src/app/utils/expired-session-error";
import {
  RegistryDuplicateError,
  RegistryLookupError,
} from "#src/app/core/config/registry/dynamic-registry";

/**
 * Centrally managed logging to allow log messages to be filtered by level and even sent to a remote logging service
 * that allows developers to monitor and analyse problems.
 *
 * Logging to the remote monitoring server is set only for warnings and errors.
 *
 * To allow remote logging, call Sentry.init during bootstrap in your AppModule or somewhere early on during startup.
 *
 * Import the constant `Logging` to use this from anywhere (without Angular DI).
 */
export class LoggingService {
  /**
   * Initialize the remote logging module with the given options.
   * If set up this will be used to send errors to a remote endpoint for analysis.
   * @param options
   */
  initRemoteLogging(options: Sentry.BrowserOptions) {
    if (!options.dsn) {
      // abort if no target url is set
      return;
    }

    const defaultOptions: Sentry.BrowserOptions = {
      release: "ndb-core@" + environment.appVersion,
      transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
      beforeBreadcrumb: enhanceSentryBreadcrumb,
      beforeSend: processSentryEvent,
    };
    Sentry.init(Object.assign(defaultOptions, options));
  }

  /**
   * Get the Angular providers to set up additional logging and tracing,
   * that should be added to the providers array of the AppModule.
   */
  getAngularTracingProviders(): (Provider | EnvironmentProviders)[] {
    return [
      /* Sentry setup */
      {
        provide: ErrorHandler,
        useValue: Sentry.createErrorHandler(),
      },
      {
        provide: Sentry.TraceService,
        deps: [Router],
      },
      provideAppInitializer(() => {
        inject(TraceService);
      }),
    ];
  }

  /**
   * Update a piece of context information that will be attached to all log messages for easier debugging,
   * especially in remote logging.
   * @param key Identifier of the key-value pair
   * @param value Value of the key-value pair
   * @param asTag If this should be added as indexed tag rather than simple context (see https://docs.sentry.io/platforms/javascript/enriching-events/tags/)
   */
  addContext(key: string, value: any, asTag: boolean = false) {
    if (asTag) {
      Sentry.setTag(key, value);
    } else {
      if (typeof value !== "object") {
        value = { value: value };
      }
      Sentry.getCurrentScope().setContext(key, value);
    }
  }

  // Deliberately no equivalent of Sentry's `setUser`: reported events carry no
  // user identity, as data minimization under the GDPR (see README.md). Adding
  // one back would put a personal identifier into every event of every issue,
  // so it is a decision to take before it is a line of code to write.

  /**
   * Log the message with "debug" level - for very detailed, non-essential information.
   * @param message
   * @param context Additional context for debugging
   */
  public debug(message: any, ...context: any[]) {
    this.log(message, LogLevel.DEBUG, ...context);
  }

  /**
   * Log the message with "info" level - for relevant information that occurs during regular functioning of the app.
   * @param message
   */
  public info(message: any) {
    this.log(message, LogLevel.INFO);
  }

  /**
   * Log the message with "warning" level - for unexpected events that the app can still handle gracefully.
   * @param message
   * @param context
   */
  public warn(message: any, ...context: any[]) {
    this.log(message, LogLevel.WARN, ...context);
  }

  /**
   * Log the message with "error" level - for unexpected critical events that cannot be handled and will affect functions.
   * @param message
   * @param context
   */
  public error(message: any, ...context: any[]) {
    this.log(message, LogLevel.ERROR, ...context);
  }

  /**
   * Generic logging of a message.
   * @param message Message to be logged
   * @param logLevel Optional log level - default is "info"
   * @param context Additional context for debugging
   */
  public log(
    message: any,
    logLevel: LogLevel = LogLevel.INFO,
    ...context: any[]
  ) {
    rememberLoggedErrors(context);
    this.logToConsole(message, logLevel, ...context);

    if (logLevel !== LogLevel.DEBUG && logLevel !== LogLevel.INFO) {
      this.logToRemoteMonitoring(message, logLevel, ...context);
    }
  }

  private logToConsole(message: any, logLevel: LogLevel, ...context: any[]) {
    switch (+logLevel) {
      case LogLevel.DEBUG:
        console.debug(message, ...context);
        break;
      case LogLevel.INFO:
        console.info(message, ...context);
        break;
      case LogLevel.WARN:
        console.warn(message, ...context);
        break;
      case LogLevel.ERROR:
        console.error(message, ...context);
        break;
      default:
        console.log(message, ...context);
        break;
    }
  }

  private logToRemoteMonitoring(
    message: any,
    logLevel: LogLevel,
    ...context: any[]
  ) {
    const extra: Record<string, unknown> = {};
    if (context.length > 0) {
      extra.context = context;
    }
    if (typeof message !== "string" && !(message instanceof Error)) {
      // an object logged as the "message" only contributes its text to the
      // report, so keep the whole of it available for debugging
      extra.message = message;
    }
    const scope = {
      extra: Object.keys(extra).length > 0 ? extra : undefined,
      level: this.translateLogLevel(logLevel),
    };

    const error = toReportedError(message, context, logLevel);
    if (error) {
      Sentry.captureException(error, scope);
    } else {
      Sentry.captureMessage(messageText(message), scope);
    }
  }

  private translateLogLevel(logLevel: LogLevel): Sentry.SeverityLevel {
    switch (+logLevel) {
      case LogLevel.DEBUG:
        return "debug";
      case LogLevel.INFO:
        return "info";
      case LogLevel.WARN:
        return "warning";
      case LogLevel.ERROR:
        return "error";
      default:
        return "info";
    }
  }
}

/**
 * Add more human-readable descriptions to Sentry breadcrumbs for debugging.
 *
 * see https://docs.sentry.io/platforms/javascript/enriching-events/breadcrumbs/
 */
function enhanceSentryBreadcrumb(
  breadcrumb: Sentry.Breadcrumb,
  hint: SentryBreadcrumbHint,
) {
  if (breadcrumb.category === "ui.click") {
    const event = hint.event;
    const elementText = event.target?.["innerText"] ?? "";
    breadcrumb.message = elementText + " | " + breadcrumb.message;
  }
  return breadcrumb;
}

/**
 * https://docs.sentry.io/platforms/javascript/configuration/filtering/#hints-for-breadcrumbs
 */
interface SentryBreadcrumbHint {
  /**
   * For breadcrumbs created from browser events, the Sentry SDK often supplies the event to the breadcrumb as a hint.
   * This can be used to extract data from the target DOM element into a breadcrumb, for example.
   */
  event?: PointerEvent;

  input?: string[];

  /**
   * e.g. console output level (warn / log / ...)
   */
  level: string;

  response?: Response;
  request?: any;
  xhr?: XMLHttpRequest;
}

export const Logging = new LoggingService();

/**
 * Wrapper that {@link LoggingService.error} creates when an error is logged
 * together with a descriptive message (`Logging.error("msg", err)`), so that the
 * message - not the underlying error's own, often generic message - becomes the
 * issue title and grouping key in remote monitoring.
 *
 * The original error is kept as `cause`, which Sentry links into the reported
 * exception chain, so its stack trace is not lost.
 */
export class LoggedError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    // Sentry reports `error.name` as the exception type. Keep the plain "Error"
    // so titles read "Error: <our message>" rather than a class name that is
    // minified in production builds anyway; the beforeSend hook recognizes this
    // wrapper through `hint.originalException instanceof LoggedError` instead.
    this.name = "Error";
  }
}

/** The text of anything that was passed to the logger as its "message". */
function messageText(message: any): string {
  return typeof message === "string"
    ? message
    : String(message?.message ?? message?.error ?? message);
}

/**
 * The Error to report for a log call, or `undefined` for one that is reported
 * as a plain message.
 *
 * An error that was logged directly is reported as it is, anything else is
 * wrapped in a {@link LoggedError} with the error from the context as its cause.
 *
 * A warning is reported as an exception, too, as soon as it comes with an
 * error: as a plain message, the error would only be extra data, which none of
 * the processing in {@link processSentryEvent} looks at. A failed request would
 * then not count as a connectivity failure, an expired session would not be
 * filtered, and the status would not be reported - so every component logging
 * a dropped connection opened an issue of its own. Only a warning without any
 * error is about the logged situation itself, and is grouped by its message.
 */
export function toReportedError(
  message: any,
  context: any[],
  logLevel: LogLevel = LogLevel.ERROR,
): Error | undefined {
  const loggedError = asError(message);
  if (loggedError) {
    return loggedError;
  }

  const cause = context.map(asError).find(Boolean);
  if (!cause && logLevel !== LogLevel.ERROR) {
    return undefined;
  }
  return new LoggedError(messageText(message), cause);
}

/**
 * The value as an Error that remote monitoring can report, if it is one.
 *
 * Angular's `HttpErrorResponse` is not an `Error`, so Sentry would neither
 * report it as an exception nor link it into a reported chain as a `cause`.
 * It is converted into one that keeps its message and status.
 */
function asError(value: unknown): Error | undefined {
  if (value instanceof Error) {
    return value;
  }
  if (value instanceof HttpErrorResponse) {
    return new HttpResponseError(value);
  }
  return undefined;
}

/** An `HttpErrorResponse` as an Error, see {@link asError}. */
class HttpResponseError extends Error {
  readonly status: number;

  constructor(response: HttpErrorResponse) {
    super(response.message);
    // a literal: the class name is minified in production builds
    this.name = "HttpErrorResponse";
    this.status = response.status;
  }
}

/**
 * Errors that were passed to the logger as context (at any level), i.e. caught
 * and dealt with where they occurred - see {@link isRethrownLoggedError}.
 */
const loggedErrors = new WeakSet<object>();

function rememberLoggedErrors(context: any[]) {
  for (const value of context) {
    if (value instanceof Error || value instanceof HttpErrorResponse) {
      loggedErrors.add(value);
    }
  }
}

/**
 * Maximum number of times an identical event is sent to remote logging
 * within one app session (page load).
 * Guards against error loops (e.g. an error thrown on every change detection
 * cycle) flooding remote monitoring with thousands of duplicate events.
 */
export const MAX_REPEATED_SENTRY_EVENTS = 5;

const sentryEventCounts = new Map<string, number>();

/**
 * Clear the repeat budget that {@link isExcessiveRepeat} keeps per app session.
 *
 * Exported for tests: nothing else resets those counters, so without this every
 * spec in a file shares one budget and whichever runs last sees its events
 * dropped instead of processed - which is easy to mistake for the behaviour
 * under test, as the budget is shared by all events of one issue.
 */
export function resetSentryEventCounts() {
  sentryEventCounts.clear();
}

/**
 * Sentry `beforeSend` hook: drops network failures of offline devices
 * and excessive repeats of an identical event,
 * and enriches the remaining events with structured extra data
 * and a stable grouping fingerprint.
 *
 * Grouping runs before the repeat cap because the cap is applied per issue,
 * which is what the fingerprint defines (see {@link isExcessiveRepeat}).
 */
export function processSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent | null {
  if (
    isOfflineNetworkError(event) ||
    isDocumentUpdateConflict(event, hint) ||
    isCausedByExpiredSession(hint) ||
    isRethrownLoggedError(event, hint)
  ) {
    return null;
  }

  const grouped = groupSentryEvent(enrichSentryEvent(event, hint), hint);
  return isExcessiveRepeat(grouped) ? null : grouped;
}

/**
 * Whether the reported error is a rejected write whose revision was out of date.
 *
 * Two users editing one record is normal operation for an offline-first app, not
 * a fault: the save is rejected, the user is told so by the form that attempted
 * it, and the occurrence is counted in usage analytics instead (see
 * `PouchDatabase.reportConflict`). Reporting it here on top of that produced a
 * steady stream of issues nobody could act on - at *error* level, so louder than
 * the failures that do need attention.
 *
 * The trade-off is deliberate: how often conflicts happen is now only visible in
 * usage analytics, not in error monitoring.
 */
function isDocumentUpdateConflict(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): boolean {
  const thrown = hint?.originalException as { status?: unknown } | undefined;
  if (
    thrown &&
    typeof thrown === "object" &&
    thrown.status === HttpStatusCode.Conflict
  ) {
    return true;
  }

  // the status is not always preserved (e.g. an error rebuilt from a
  // `_bulk_docs` result), so fall back to the message - normalized, because
  // PouchDB words it both with and without a trailing period
  return [
    event.message,
    ...(event.exception?.values?.map((v) => v.value) ?? []),
  ].some((msg) => msg && fingerprintKey(msg).includes(CONFLICT_MESSAGE));
}

/**
 * Whether the event is an error that was already logged where it was caught,
 * and then went unhandled because it was also rethrown to a caller that does
 * not catch it.
 *
 * The log call already decided how to report the failure: with a message
 * saying what failed, and at the level its cause deserves (a sync stalled by a
 * flaky connection only at debug level). The unhandled error adds nothing but
 * a second issue for the same failure, under the error's own and usually less
 * telling title - a failed sync came in both as "sync failed" and as
 * "Error: No error message" (AAM-DIGITAL-6Y8, AAM-DIGITAL-7B5).
 *
 * Only unhandled events are dropped, so an error that is logged again on
 * purpose (`Logging.error(err)` after `Logging.debug("...", err)`) is still
 * reported. The caller that let it go unhandled is still worth fixing: it
 * should catch, or the error should not be rethrown.
 */
function isRethrownLoggedError(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): boolean {
  const thrown = hint?.originalException;
  return (
    typeof thrown === "object" &&
    thrown !== null &&
    loggedErrors.has(thrown) &&
    !!event.exception?.values?.some((v) => v.mechanism?.handled === false)
  );
}

/** How PouchDB words a rejected write, after {@link fingerprintKey} normalization. */
const CONFLICT_MESSAGE = "document update conflict";

/** How many `cause` levels {@link causeChain} follows. */
const MAX_CAUSE_DEPTH = 5;

/**
 * Whether the reported error is (or was caused by) the server rejecting an
 * expired access token that could not be renewed.
 *
 * `RemotePouchDatabase` renews the session and repeats such a request, so this
 * only surfaces while the login server cannot be reached - a transient state
 * the user is told about there, which says nothing about the code that
 * happened to be waiting for the data. Filtering it here spares every consumer
 * of the database from having to recognize it (whether it logs the failure,
 * wraps it or lets it go unhandled).
 *
 * The trade-off is deliberate: a consumer that mishandles a failed load is not
 * reported while the failure is an expired session (only through other causes,
 * e.g. connectivity). This also applies to errors that merely wrap it, like a
 * `ConfigLoadError` - which tells the user and reloads the app itself. Other `401` reasons (e.g. an invalid token signature)
 * are still reported, see {@link isExpiredSessionError}.
 *
 * The original error is inspected rather than the serialized event, as that
 * loses the `status` and `reason` of a wrapped `DatabaseException`.
 */
function isCausedByExpiredSession(hint: Sentry.EventHint): boolean {
  return causeChain(hint?.originalException).some(isExpiredSessionError);
}

/**
 * The error and the `cause`s it wraps, outermost first (up to
 * {@link MAX_CAUSE_DEPTH} levels, and safe against a cause referring back).
 */
function causeChain(error: unknown): object[] {
  const chain: object[] = [];
  let current = error;
  while (
    current &&
    typeof current === "object" &&
    !chain.includes(current) &&
    chain.length <= MAX_CAUSE_DEPTH
  ) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
}

/**
 * Whether the event is a network-layer fetch failure that occurred while the
 * device was offline. In an offline-first app this is a normal state without
 * diagnostic value (server outages still surface through online users).
 */
function isOfflineNetworkError(event: Sentry.ErrorEvent): boolean {
  if (navigator.onLine) {
    return false;
  }

  const messages = [
    event.message,
    ...(event.exception?.values?.map((v) => v.value) ?? []),
  ];
  return messages.some((msg) => msg && isConnectivityErrorMessage(msg));
}

/**
 * Count occurrences of an event and check whether it exceeded the session cap.
 *
 * The budget is one per issue (see {@link repeatKey}), so that a device running
 * into several problems at once still reports each of them. Keying it more
 * coarsely - by the root cause the issues have in common - starves them instead:
 * in an offline-first app a single connectivity failure is the root cause of the
 * config load, the permission rules, the sync and every file download alike, so
 * whichever of them failed first would silence all the others for that session.
 *
 * Note that the cap therefore also limits how much an issue's event count says
 * about the volume of a problem - it shows that it occurs, not how often.
 */
function isExcessiveRepeat(event: Sentry.ErrorEvent): boolean {
  const key = repeatKey(event);

  const count = (sentryEventCounts.get(key) ?? 0) + 1;
  sentryEventCounts.set(key, count);

  if (count > MAX_REPEATED_SENTRY_EVENTS) {
    Logging.debug("Skipping repeated event for remote logging", {
      event: key,
      occurrence: count,
    });
    return true;
  }
  return false;
}

/**
 * The issue an event will end up in, as far as it is known here: the
 * fingerprint is exactly what separates issues, and for the events that keep
 * Sentry's stack-based grouping the thrown error is the closest stand-in
 * (deliberately without any stack information, so that an error loop is capped
 * even where the frames differ between occurrences).
 */
function repeatKey(event: Sentry.ErrorEvent): string {
  // serialized as a tagged tuple so that neither the elements of a fingerprint
  // nor the three kinds of key can collide with one another
  if (event.fingerprint?.length) {
    return JSON.stringify(["fingerprint", ...event.fingerprint]);
  }

  const values = event.exception?.values;
  const thrownError = values?.[values.length - 1];
  return thrownError
    ? JSON.stringify([
        "exception",
        thrownError.type,
        fingerprintKey(thrownError.value),
      ])
    : JSON.stringify([
        "message",
        fingerprintKey(String(event.message ?? "unknown")),
      ]);
}

/**
 * Our own error classes that describe *what* failed precisely enough that all
 * their occurrences belong into a single issue in remote monitoring,
 * no matter which component, route or async call site ran into them.
 *
 * For these, Sentry's default grouping by stack trace actively hurts: they are
 * thrown from one central place, while the stack differs per caller and even
 * per build (releases without source maps report minified frames). One problem
 * then scatters across a dozen issues that each have to be triaged separately,
 * and archiving one of them does not silence the others.
 *
 * Only add error types whose name and message already identify the problem on
 * their own, so that the stack adds nothing but noise. Generic errors (`Error`,
 * `TypeError`, ...) must keep the default grouping - for those the stack trace
 * is the only thing telling two unrelated bugs apart.
 */
const CAUSE_GROUPED_ERROR_TYPES = [
  "DatabaseException",
  "SyncStalledError",
  "ConfigLoadError",
  "PermissionRulesLoadError",
  "SiteSettingsLoadError",
  "RegistryLookupError",
  "RegistryDuplicateError",
];

/**
 * Data that varies between occurrences of the same problem and therefore has to
 * be masked before an error message can be used as a grouping key.
 * Order matters: the more specific patterns have to run before the plain number.
 */
const VOLATILE_VALUE_PATTERNS: [RegExp, string][] = [
  // a response body quoted into an error message (a proxy failure, an error
  // page served by the reverse proxy): its content varies per request and can
  // be a whole HTML document, which as an issue title hides every other row
  [/ with body ["'][\s\S]*$/i, ""],
  [/https?:\/\/\S+/gi, "<url>"],
  [
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "<uuid>",
  ],
  [/\b\d+-[0-9a-f]{32}\b/gi, "<rev>"],
  // legacy entity ids that embed a username (e.g. `User:some.person`); the
  // uuid-based ones are already masked above. Requires a non-space directly
  // after the colon, so that an error prefix like "TypeError: ..." is kept.
  [/\b[A-Z][A-Za-z]{2,}:[A-Za-z0-9._<>-]+/g, "<entityId>"],
  [/\d+/g, "<n>"],
];

/**
 * Mask volatile details (ids, urls, numbers) so that different occurrences of
 * the same problem produce the same string.
 *
 * Stays human-readable, as it is also used to describe the root cause in the
 * issue title (see {@link describeCause}).
 */
function normalizeErrorValue(value: string | undefined): string {
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
 * Reduce an error message to a grouping key.
 *
 * On top of {@link normalizeErrorValue} this also removes differences that
 * carry no meaning but do split issues, as third-party libraries are not
 * consistent about them: PouchDB reports both "Unauthorized" and
 * "unauthorized", and both "Document update conflict" and "Document update
 * conflict." (with a period) for the same failure.
 */
function fingerprintKey(value: string | undefined): string {
  return normalizeErrorValue(value)
    .toLowerCase()
    .replace(/[.,;:!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Set an explicit grouping fingerprint where Sentry's default grouping splits
 * one problem across many issues.
 *
 * Sentry groups by stack trace whenever one is available. That is the right
 * default for a bug in application code, but not for a failure that is raised
 * from one central place and reached from many components, routes and async
 * call sites - the stack then differs per caller and even per build (releases
 * without source maps report minified frames), so one problem scatters across a
 * dozen issues that each have to be triaged separately, and archiving one of
 * them does not silence the others.
 *
 * The cases are checked most-specific first: an error we recognize by name says
 * more about what went wrong than the fact that a network request failed
 * underneath it, so those keep their own issues instead of being absorbed into
 * the shared network bucket.
 */
function groupSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent {
  const values = event.exception?.values;
  if (!values?.length) {
    // captureMessage events group by their message. Normalizing it enforces the
    // "keep message strings static" convention: a message that does interpolate
    // variable data still produces one issue instead of one per value.
    if (event.message) {
      event.fingerprint = [fingerprintKey(event.message)];
    }
    return event;
  }

  const thrownError = values[values.length - 1];
  const thrownType = thrownError.type ?? "";

  if (CAUSE_GROUPED_ERROR_TYPES.includes(thrownType)) {
    return groupByErrorChain(event, values, thrownError);
  }

  if (hint?.originalException instanceof LoggedError) {
    const unreachableServer = loggedUnreachableServer(event, values);
    if (unreachableServer) {
      event.tags = {
        ...event.tags,
        // Sentry rejects tag values longer than 200 characters
        logged_message: normalizeErrorValue(thrownError.value).slice(0, 200),
      };
      return groupAsNetworkError(event, thrownError, unreachableServer);
    }
    return groupByErrorChain(event, values, thrownError);
  }

  const rewrapped = rewrappedCauseGroupedError(values);
  if (rewrapped) {
    return groupByErrorChain(event, values, rewrapped);
  }

  if (values.some(isConnectivityException) || hasConnectivityStatus(event)) {
    return groupAsNetworkError(event, thrownError);
  }

  if (!values.some((v) => v.stacktrace?.frames?.length)) {
    // without a stack Sentry falls back to grouping by type and message, so an
    // id or url interpolated into the message opens a new issue every time
    event.fingerprint = [
      thrownType || "Error",
      fingerprintKey(thrownError.value),
    ];
    reportNormalized(event, thrownError);
  }

  return event;
}

/**
 * The error of a recognized type (see {@link CAUSE_GROUPED_ERROR_TYPES}) that a
 * framework re-threw as a generic one, if that is what this chain is.
 *
 * Angular does this for an error raised inside a `resource()` loader: it wraps
 * it in an error of its own that copies the original's message and whose type
 * is the plain "Error" a subclass inherits. The wrapper contributes nothing but
 * a different stack trace, so grouping by it opens a separate issue per call
 * site for exactly the problem that {@link groupByErrorChain} keeps as one.
 *
 * Only a wrapper that repeats the recognized error's message counts as such.
 * One that says what it was doing ("Failed to load configuration from the
 * database.") describes the failure better than its cause does, and stays the
 * error the event is grouped by.
 */
function rewrappedCauseGroupedError(
  values: Sentry.Exception[],
): Sentry.Exception | undefined {
  // fingerprintKey already lower-cased and stripped the colon, leaving at most
  // this leading "error " from the `Error: <cause>` shape `.toString()` gives
  const thrownValue = fingerprintKey(values[values.length - 1].value).replace(
    /^error /,
    "",
  );
  return values
    .slice(0, -1)
    .find(
      (cause) =>
        CAUSE_GROUPED_ERROR_TYPES.includes(cause.type ?? "") &&
        thrownValue === fingerprintKey(cause.value),
    );
}

/**
 * The failed request that a {@link LoggedError} directly wraps, if that is all
 * it has to report.
 *
 * The message an error is logged with says where it happened ("Failed to load
 * important notes"), which for most errors is what tells two problems apart.
 * For a request that never reached the server it is not: the connection
 * failed, and every component loading data at that moment logs it under a
 * message of its own. Grouped by those, a single connectivity drop opens one
 * issue per component - next to the issue the same failure already has where
 * it is reported without a message. Grouping them by the wrapped error puts
 * them into that one issue instead; the logged message is kept as a tag, and
 * the route is still the `transaction` tag.
 *
 * Only a request to our own backend (see {@link BACKEND_REQUEST_ERROR_TYPES})
 * directly below the wrapper qualifies:
 * - a named error in between (a `ConfigLoadError` caused by a failed fetch)
 *   says more than the fact that a request failed, and keeps its own issue;
 * - any other failure to load something keeps its own issue as well: a chunk
 *   that did not load during bootstrap, so that the app never started, would
 *   disappear among requests of no consequence.
 *
 * A request counts as not having reached the server by its message or by a
 * gateway status, which a failed HTTP response carries instead (see
 * {@link hasConnectivityStatus}).
 */
function loggedUnreachableServer(
  event: Sentry.ErrorEvent,
  values: Sentry.Exception[],
): Sentry.Exception | undefined {
  const wrapped = values[values.length - 2];
  return wrapped &&
    BACKEND_REQUEST_ERROR_TYPES.includes(wrapped.type ?? "") &&
    (isConnectivityException(wrapped) || hasConnectivityStatus(event))
    ? wrapped
    : undefined;
}

/**
 * The types of error that stand for a failed request to our own backend:
 * a `DatabaseException` and an `HttpErrorResponse` (as converted by `asError`).
 */
const BACKEND_REQUEST_ERROR_TYPES = ["DatabaseException", "HttpErrorResponse"];

/**
 * Report an exception under the normalized message it is grouped by, keeping
 * the original one as extra data.
 *
 * Sentry titles an issue by the reported message, so the volatile details that
 * {@link fingerprintKey} masks out of the grouping key are still what the issue
 * list shows: one row per document id, and a response body quoted into an error
 * message (an nginx error page, say) pushing every other row off the screen.
 * Only used where the message is the grouping key anyway, so that the title of
 * an issue and the reason its events are in it cannot drift apart.
 */
function reportNormalized(
  event: Sentry.ErrorEvent,
  exception: Sentry.Exception,
) {
  if (!exception.value) {
    // nothing to read either way, and a placeholder would only pretend there is
    return;
  }
  const normalized = normalizeErrorValue(exception.value).slice(
    0,
    MAX_REPORTED_MESSAGE_LENGTH,
  );
  if (normalized === exception.value) {
    return;
  }
  event.extra = { ...event.extra, originalError: exception.value };
  exception.value = normalized;
}

/**
 * How much of an error message is kept as the reported one (see
 * {@link reportNormalized}). Generous enough for any message written to be
 * read, and a backstop against the ones that turn out to be a serialized
 * document or a web page.
 */
const MAX_REPORTED_MESSAGE_LENGTH = 300;

/**
 * Group by the error chain instead of the stack trace, so that one problem
 * shows up as one issue.
 *
 * `exception.values` is ordered innermost-first: `values[0]` is the deepest
 * `cause`, the originally thrown error is last. Both ends matter - the thrown
 * error says which operation failed, the root cause says why (e.g. a config
 * load failing because the device is offline is a different problem from the
 * same load failing because the user is unauthorized).
 *
 * The error the event is grouped by is usually the thrown one, but can be a
 * link further down the chain when the ones above it add nothing (see
 * {@link rewrappedCauseGroupedError} and {@link loggedUnreachableServer}).
 *
 * Because the root cause is part of the grouping key, it is also appended to
 * the reported message: otherwise several issues share one title (a dozen
 * "Failed to load configuration from the database." rows) and can only be told
 * apart by opening each of them.
 *
 * The route remains available as the `transaction` tag, so a failure can still
 * be filtered by where it happened without splitting it into separate issues.
 */
function groupByErrorChain(
  event: Sentry.ErrorEvent,
  values: Sentry.Exception[],
  groupedError: Sentry.Exception,
): Sentry.ErrorEvent {
  const thrownError = values[values.length - 1];
  const groupedType = groupedError.type ?? "";
  const groupedValue = groupingValue(groupedError);
  if (groupedValue === NETWORK_FAILURE) {
    // the error identifying the problem is the failed request itself - a
    // `DatabaseException` only says which layer made it, and is no different
    // from the requests that fail outside of that layer (e.g. a response body
    // cut off while PouchDB reads it). Kept apart, the same dropped
    // connection had two issues (AAM-DIGITAL-77A, AAM-DIGITAL-77E).
    return groupAsNetworkError(event, thrownError, groupedError);
  }
  const fingerprint = [groupedType, groupedValue];

  const rootCause = values[0];
  const rootType = rootCause.type ?? "";
  const rootValue = groupingValue(rootCause);
  // compared by content, not by identity: an error wrapping another error of
  // the same type and message describes one failure, not two, and has to match
  // the fingerprint of the same failure reported without the extra wrapper.
  const isDistinctCause =
    rootType !== groupedType || rootValue !== groupedValue;

  if (isDistinctCause) {
    fingerprint.push(rootType, rootValue);
    groupedError.value = `${groupedError.value} ${describeCause(rootCause)}`;
  }

  if (thrownError !== groupedError) {
    // Sentry titles an event by its thrown error, so a title taken from the
    // links above the grouped one would differ from the title the same problem
    // has everywhere else in its issue
    thrownError.type = groupedError.type;
    thrownError.value = groupedError.value;
  }

  event.fingerprint = fingerprint;
  return event;
}

/**
 * The title of the network issue, which does not depend on which browser (or
 * library) sent the event (see {@link groupAsNetworkError}).
 */
const UNREACHABLE_SERVER_TITLE = "Failed to reach the server";

/**
 * Placeholder for a connectivity failure, which every browser words differently
 * ("Failed to fetch" / "Load failed" / ...) while describing one problem.
 *
 * Substituted wherever an error message is used as a grouping key or shown as
 * the cause of another error, so that a mix of browsers neither splits an issue
 * nor makes its title flip-flop between its events.
 */
const NETWORK_FAILURE = "network failure";

/** The part of an error message that identifies the problem. */
function groupingValue(exception: Sentry.Exception): string {
  return isConnectivityException(exception)
    ? NETWORK_FAILURE
    : fingerprintKey(exception.value);
}

/** Human-readable, but stable across occurrences of the same problem. */
function describeCause(rootCause: Sentry.Exception): string {
  const cause = isConnectivityException(rootCause)
    ? NETWORK_FAILURE
    : normalizeErrorValue(rootCause.value);
  return `(caused by ${rootCause.type ?? "Error"}: ${cause})`;
}

/**
 * Collect all failures that are really "the app could not reach the server"
 * into a single issue.
 *
 * These are raised by the browser (and by third-party libraries wrapping it) at
 * whatever point a request happened to be made, so grouping them by stack trace
 * produces an open-ended stream of near-identical issues that all have the same
 * (non-)answer. They still have to be reported rather than dropped, because a
 * server outage surfaces exactly this way - but as one issue whose event count
 * is the interesting signal.
 *
 * The browsers' differing wordings ("Failed to fetch" / "Load failed" / ...)
 * would make the title flip-flop between events of the merged issue, so it is
 * replaced by a stable one and kept as a searchable tag instead.
 *
 * Reported as a warning: the failure is (almost always) the connection of one
 * device, and an outage shows as a rise of this one issue, not as an error.
 *
 * @param thrownError the error the event is titled by
 * @param failedRequest the link of the chain that is the failed request, if
 *   that is not the thrown error itself (e.g. the cause of a `LoggedError`)
 */
function groupAsNetworkError(
  event: Sentry.ErrorEvent,
  thrownError: Sentry.Exception,
  failedRequest: Sentry.Exception = thrownError,
): Sentry.ErrorEvent {
  const original = `${failedRequest.type ?? "Error"}: ${normalizeErrorValue(failedRequest.value)}`;

  event.fingerprint = ["network-error"];
  event.level = "warning";
  event.tags = {
    ...event.tags,
    // Sentry rejects tag values longer than 200 characters
    network_error: original.slice(0, 200),
  };

  event.extra = { ...event.extra, originalError: failedRequest.value };
  thrownError.type = "NetworkError";
  thrownError.value = UNREACHABLE_SERVER_TITLE;

  return event;
}

/** Whether one link of a reported error chain is a connectivity failure. */
function isConnectivityException(exception: Sentry.Exception): boolean {
  return (
    CONNECTIVITY_ERROR_NAMES.includes(exception.type ?? "") ||
    isConnectivityErrorMessage(exception.value ?? "")
  );
}

/**
 * Whether the reported error carries the HTTP status of a request that never
 * reached the backend - a gateway error names the problem in its status rather
 * than in a message {@link isConnectivityException} could recognize.
 *
 * Event-level: the status is attached by {@link enrichSentryEvent}, from the
 * outermost error in the chain that has one - the captured error itself, or
 * the failed request it wraps.
 */
function hasConnectivityStatus(event: Sentry.ErrorEvent): boolean {
  const status = event.extra?.status;
  return (
    typeof status === "number" && CONNECTIVITY_ERROR_STATUS.includes(status)
  );
}

/**
 * Placeholder type for an exception reported without one.
 *
 * Sentry builds an issue title from the reported exception's type and message,
 * and lists an issue whose exception carries no type as `<unknown>` - which
 * says nothing at all in a list of issues, and hides the message that would
 * have. The generic name is no loss: it is what an `Error` subclass reports
 * anyway unless it sets `name` explicitly (see {@link CAUSE_GROUPED_ERROR_TYPES}).
 */
const FALLBACK_EXCEPTION_TYPE = "Error";

/**
 * Which registration a registry error is about, if there is one in the chain.
 *
 * The key is not part of the error message, so that all keys of one registry
 * share one issue (see {@link RegistryLookupError}) - this is what still names
 * it in each report. The cause chain is searched as well, because Angular
 * re-throws an error raised in a `resource()` loader as an error of its own
 * (see {@link rewrappedCauseGroupedError}), which does not carry the key.
 */
function registryErrorContext(err: unknown): Record<string, string> {
  const registryError = causeChain(err).find(
    (e) =>
      e instanceof RegistryLookupError || e instanceof RegistryDuplicateError,
  ) as RegistryLookupError | RegistryDuplicateError | undefined;
  return registryError
    ? { registry: registryError.registryName, registryKey: registryError.key }
    : {};
}

/**
 * Enrich events with structured extra data
 * from custom Error properties (e.g. DatabaseException's entityId, status, reason).
 */
function enrichSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent {
  // Attach structured properties from custom Error subclasses (e.g. DatabaseException,
  // EntityPermissionError) so that details like entityId, status, reason are visible in
  // Sentry's "Additional Data" - even though (deliberately) not part of the message itself.
  //
  // The whole cause chain is searched, outermost first: a wrapper that says
  // which operation failed (a `LoggedError`, a `ConfigLoadError`) usually has
  // none of these itself, while the status and reason of the request that
  // failed underneath it are what tells e.g. an expired session from a missing
  // permission.
  const err = hint.originalException;
  if (err && typeof err === "object") {
    const extras: Record<string, unknown> = {};
    for (const error of causeChain(err) as Record<string, any>[]) {
      for (const key of [
        "entityId",
        "status",
        "reason",
        "name",
        "action",
        "entityType",
      ]) {
        if (extras[key] === undefined && error[key] !== undefined) {
          extras[key] = error[key];
        }
      }
      // a library may pass on the whole `fetch` Response rather than the status
      // (keycloak-js does), which otherwise leaves a report saying only that the
      // status was invalid and never which one it was
      const nestedStatus = error.response?.status;
      if (extras.status === undefined && typeof nestedStatus === "number") {
        extras.status = nestedStatus;
      }
    }

    Object.assign(extras, registryErrorContext(err));

    if (Object.keys(extras).length > 0) {
      event.extra = { ...event.extra, ...extras };
    }
  }

  for (const exception of event.exception?.values ?? []) {
    exception.type ||= FALLBACK_EXCEPTION_TYPE;
  }

  return event;
}
