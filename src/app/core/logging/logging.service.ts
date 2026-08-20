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
    if (logLevel === LogLevel.ERROR) {
      // Prefer a real Error from context (e.g. Logging.error("message", err))
      const errFromContext = context.find((c) => c instanceof Error);
      if (message instanceof Error) {
        Sentry.captureException(message, {
          extra: context.length > 0 ? { context } : undefined,
        });
      } else if (errFromContext) {
        Sentry.captureException(errFromContext, {
          extra: { message, context },
        });
      } else {
        Sentry.captureException(
          new Error(message?.message ?? message?.error ?? String(message)),
          { extra: context.length > 0 ? { context } : undefined },
        );
      }
    } else {
      Sentry.captureMessage(
        typeof message === "string"
          ? message
          : String(message?.message ?? message),
        {
          level: this.translateLogLevel(logLevel),
          extra: context.length > 0 ? { context } : undefined,
        },
      );
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
 * Maximum number of times an identical event is sent to remote logging
 * within one app session (page load).
 * Guards against error loops (e.g. an error thrown on every change detection
 * cycle) flooding remote monitoring with thousands of duplicate events.
 */
export const MAX_REPEATED_SENTRY_EVENTS = 5;

const sentryEventCounts = new Map<string, number>();

/**
 * Error message fragments produced by browsers (and our fetch wrapper)
 * when a request fails at the network layer.
 */
const NETWORK_ERROR_PATTERNS = [
  "Failed to fetch", // Chrome (also matches DatabaseException "Failed to fetch from DB")
  "NetworkError when attempting to fetch resource", // Firefox
  "Load failed", // Safari
];

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
  return fingerprintSentryEvent(enrichSentryEvent(event, hint));
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
  return messages.some(
    (msg) => msg && NETWORK_ERROR_PATTERNS.some((p) => msg.includes(p)),
  );
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
 *   see {@link fingerprintSentryEvent} for how issues are separated.
 * - Errors that interpolate data (e.g. entity IDs) into their message still
 *   share one budget, because the key is normalized the same way as the
 *   grouping fingerprint.
 */
function isExcessiveRepeat(event: Sentry.ErrorEvent): boolean {
  const exception = event.exception?.values?.[0];
  const key = exception
    ? `${exception.type}: ${normalizeErrorValue(exception.value)}`
    : normalizeErrorValue(String(event.message ?? "unknown"));

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
  [/\d+/g, "<n>"],
];

/**
 * Mask volatile details (ids, urls, numbers) so that different occurrences of
 * the same problem produce the same string.
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
 * Group events of our own wrapper error classes (see
 * {@link CAUSE_GROUPED_ERROR_TYPES}) by their error chain instead of by stack
 * trace, so that one problem shows up as one issue.
 *
 * `exception.values` is ordered innermost-first: `values[0]` is the deepest
 * `cause`, the originally thrown error is last. Both ends matter - the thrown
 * error says which operation failed, the root cause says why (e.g. a config
 * load failing because the device is offline is a different problem from the
 * same load failing because the user is unauthorized).
 *
 * The route remains available as the `transaction` tag, so a failure can still
 * be filtered by where it happened without splitting it into separate issues.
 */
function fingerprintSentryEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  const values = event.exception?.values;
  if (!values?.length) {
    // captureMessage events group by their message,
    // which is kept free of variable data by convention
    return event;
  }

  const thrownError = values[values.length - 1];
  const thrownType = thrownError.type ?? "";
  if (!CAUSE_GROUPED_ERROR_TYPES.includes(thrownType)) {
    return event;
  }

  const thrownValue = normalizeErrorValue(thrownError.value);
  const fingerprint = [thrownType, thrownValue];

  const rootCause = values[0];
  const rootType = rootCause.type ?? "";
  const rootValue = normalizeErrorValue(rootCause.value);
  // compared by content, not by identity: an error wrapping another error of
  // the same type and message describes one failure, not two, and has to match
  // the fingerprint of the same failure reported without the extra wrapper
  if (rootType !== thrownType || rootValue !== thrownValue) {
    fingerprint.push(rootType, rootValue);
  }

  event.fingerprint = fingerprint;
  return event;
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
