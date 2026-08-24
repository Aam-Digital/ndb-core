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
import { Router } from "@angular/router";
import { LoginState } from "../session/session-states/login-state.enum";
import { LoginStateSubject } from "../session/session-type";
import { SessionSubject } from "../session/auth/session-info";
import { TraceService } from "@sentry/angular";
import {
  CONNECTIVITY_ERROR_NAMES,
  isConnectivityErrorMessage,
} from "#src/app/utils/connectivity-error";

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
   * Register any additional logging context integrations that need Angular services.
   * @param loginState
   * @param sessionInfo
   */
  initAngularLogging(
    loginState: LoginStateSubject,
    sessionInfo: SessionSubject,
  ) {
    return () =>
      loginState.subscribe((newState) => {
        if (newState === LoginState.LOGGED_IN) {
          const username = sessionInfo.value?.id;
          Logging.setLoggingContextUser(username);
        } else {
          Logging.setLoggingContextUser(undefined);
        }
      });
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
      provideAppInitializer(() => {
        Logging.initAngularLogging(
          inject(LoginStateSubject),
          inject(SessionSubject),
        );
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

  /**
   * Update the username to be attached to all log messages for easier debugging,
   * especially in remote logging.
   * @param username
   */
  setLoggingContextUser(username: string) {
    Sentry.setUser({ username: username });
  }

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
    };

    if (logLevel === LogLevel.ERROR) {
      Sentry.captureException(toReportedError(message, context), scope);
    } else {
      Sentry.captureMessage(messageText(message), {
        ...scope,
        level: this.translateLogLevel(logLevel),
      });
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
 * The Error to report for a log call: an error that was logged directly is
 * reported as it is, anything else is wrapped in a {@link LoggedError}.
 */
export function toReportedError(message: any, context: any[]): Error {
  if (message instanceof Error) {
    return message;
  }
  return new LoggedError(
    messageText(message),
    context.find((c) => c instanceof Error),
  );
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
 * Sentry `beforeSend` hook: drops network failures of offline devices
 * and excessive repeats of an identical event,
 * and enriches the remaining events with structured extra data
 * and a stable grouping fingerprint.
 */
export function processSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent | null {
  if (isOfflineNetworkError(event) || isExcessiveRepeat(event)) {
    return null;
  }
  return groupSentryEvent(enrichSentryEvent(event, hint), hint);
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
 * The key is deliberately coarse: error class + normalized message of the root
 * cause (`values[0]` is the deepest `cause` in the chain; the originally thrown,
 * outermost error is last), without any stack information.
 * Consequences:
 * - Same-message errors from different code paths share one budget,
 *   and all wrappers of a cascading failure are capped via their common
 *   root cause. This is a flood guard, not a grouping mechanism -
 *   see {@link groupSentryEvent} for how issues are separated.
 * - Errors that interpolate data (e.g. entity IDs) into their message still
 *   share one budget, because the key is normalized the same way as the
 *   grouping fingerprint.
 */
function isExcessiveRepeat(event: Sentry.ErrorEvent): boolean {
  const exception = event.exception?.values?.[0];
  const key = exception
    ? `${exception.type}: ${fingerprintKey(exception.value)}`
    : fingerprintKey(String(event.message ?? "unknown"));

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

  if (
    CAUSE_GROUPED_ERROR_TYPES.includes(thrownType) ||
    hint?.originalException instanceof LoggedError
  ) {
    return groupByErrorChain(event, values);
  }

  if (values.some(isConnectivityException)) {
    return groupAsNetworkError(event, thrownError);
  }

  if (!values.some((v) => v.stacktrace?.frames?.length)) {
    // without a stack Sentry falls back to grouping by type and message, so an
    // id or url interpolated into the message opens a new issue every time
    event.fingerprint = [
      thrownType || "Error",
      fingerprintKey(thrownError.value),
    ];
  }

  return event;
}

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
): Sentry.ErrorEvent {
  const thrownError = values[values.length - 1];
  const thrownType = thrownError.type ?? "";
  const thrownValue = groupingValue(thrownError);
  const fingerprint = [thrownType, thrownValue];

  const rootCause = values[0];
  const rootType = rootCause.type ?? "";
  const rootValue = groupingValue(rootCause);
  // compared by content, not by identity: an error wrapping another error of
  // the same type and message describes one failure, not two, and has to match
  // the fingerprint of the same failure reported without the extra wrapper.
  // Two links that are both network failures are one such case - which of them
  // the chain happens to include says nothing about the problem.
  const isDistinctCause =
    !(thrownValue === NETWORK_FAILURE && rootValue === NETWORK_FAILURE) &&
    (rootType !== thrownType || rootValue !== thrownValue);

  if (isDistinctCause) {
    fingerprint.push(rootType, rootValue);
    thrownError.value = `${thrownError.value} ${describeCause(rootCause)}`;
  }

  if (thrownValue === NETWORK_FAILURE) {
    // the wordings collected here differ per browser, so use a stable title
    reportAsUnreachableServer(event, thrownError);
  }

  event.fingerprint = fingerprint;
  return event;
}

/**
 * Replace the reported message by one that does not depend on which browser
 * (or library) sent the event, keeping the original one available as extra data.
 */
function reportAsUnreachableServer(
  event: Sentry.ErrorEvent,
  exception: Sentry.Exception,
) {
  event.extra = { ...event.extra, originalError: exception.value };
  exception.value = "Failed to reach the server";
}

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
 */
function groupAsNetworkError(
  event: Sentry.ErrorEvent,
  thrownError: Sentry.Exception,
): Sentry.ErrorEvent {
  const original = `${thrownError.type ?? "Error"}: ${normalizeErrorValue(thrownError.value)}`;

  event.fingerprint = ["network-error"];
  event.tags = {
    ...event.tags,
    // Sentry rejects tag values longer than 200 characters
    network_error: original.slice(0, 200),
  };

  reportAsUnreachableServer(event, thrownError);
  thrownError.type = "NetworkError";

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
 * Enrich events with structured extra data
 * from custom Error properties (e.g. DatabaseException's entityId, status, reason).
 */
function enrichSentryEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint,
): Sentry.ErrorEvent {
  // Attach structured properties from custom Error subclasses (e.g. DatabaseException)
  // so that details like entityId, status, reason are visible in Sentry's "Additional Data"
  const err = hint.originalException;
  if (err && typeof err === "object") {
    const extras: Record<string, unknown> = {};
    for (const key of ["entityId", "status", "reason", "name"]) {
      if (key in err && (err as any)[key] !== undefined) {
        extras[key] = (err as any)[key];
      }
    }
    if (Object.keys(extras).length > 0) {
      event.extra = { ...event.extra, ...extras };
    }
  }

  return event;
}
