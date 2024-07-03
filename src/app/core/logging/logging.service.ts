import { Injectable } from "@angular/core";
import { LogLevel } from "./log-level";
import * as Sentry from "@sentry/browser";
import { environment } from "../../../environments/environment";

/* eslint-disable no-console */

/**
 * Centrally managed logging to allow log messages to be filtered by level and even sent to a remote logging service
 * that allows developers to monitor and analyse problems.
 *
 * Logging to the remote monitoring server is set only for warnings and errors.
 *
 * To allow remote logging, call Sentry.init during bootstrap in your AppModule or somewhere early on during startup.
 */
@Injectable({
  providedIn: "root",
})
export class LoggingService {
  /**
   * Initialize the remote logging module with the given options.
   * If set up this will be used to send errors to a remote endpoint for analysis.
   * @param options
   */
  static initRemoteLogging(options: Sentry.BrowserOptions) {
    if (!options.dsn) {
      // abort if no target url is set
      return;
    }

    const defaultOptions = {
      release: "ndb-core@" + environment.appVersion,
      transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
      beforeBreadcrumb: enhanceSentryBreadcrumb,
    };
    Sentry.init(Object.assign(defaultOptions, options));
  }

  /**
   * Update a piece of context information that will be attached to all log messages for easier debugging,
   * especially in remote logging.
   * @param key Identifier of the key-value pair
   * @param value Value of the key-value pair
   * @param asTag If this should be added as indexed tag rather than simple context (see https://docs.sentry.io/platforms/javascript/enriching-events/tags/)
   */
  static addContext(key: string, value: any, asTag: boolean = false) {
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
  static setLoggingContextUser(username: string) {
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
      this.logToRemoteMonitoring(message, logLevel);
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

  private logToRemoteMonitoring(message: any, logLevel: LogLevel) {
    if (logLevel === LogLevel.ERROR) {
      if (message instanceof Error) {
        Sentry.captureException(message);
      } else {
        Sentry.captureException(
          new Error(message?.message ?? message?.error ?? message),
        );
      }
    } else {
      Sentry.captureMessage(message, this.translateLogLevel(logLevel));
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
