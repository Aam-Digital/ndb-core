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
import { TraceService } from "@sentry/angular";
import { processSentryEvent } from "./sentry-event-processing";
import { LoggedError } from "./reported-errors";

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

/** The text of anything that was passed to the logger as its "message". */
function messageText(message: any): string {
  return typeof message === "string"
    ? message
    : String(message?.message ?? message?.error ?? message);
}

/**
 * The Error to report for a log call, or `undefined` for a plain message event.
 *
 * A logged message comes with the logged error as its `cause` (a {@link LoggedError}),
 * also for a warning: only as an exception is the error grouped and filtered by its
 * cause. A warning without an error is about the situation itself.
 */
export function toReportedError(
  message: any,
  context: any[],
  logLevel: LogLevel = LogLevel.ERROR,
): Error | undefined {
  if (message instanceof Error) {
    return message;
  }

  const cause = context.find((c) => c instanceof Error);
  if (!cause && logLevel !== LogLevel.ERROR) {
    return undefined;
  }
  return new LoggedError(messageText(message), cause);
}
