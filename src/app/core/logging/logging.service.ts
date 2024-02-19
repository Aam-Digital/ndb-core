import { Injectable } from "@angular/core";
import { LogLevel } from "./log-level";
import * as Sentry from "@sentry/browser";
import { BrowserOptions, SeverityLevel } from "@sentry/browser";
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
  static initRemoteLogging(options: BrowserOptions) {
    if (!options.dsn) {
      // abort if no target url is set
      return;
    }

    const defaultOptions = {
      release: "ndb-core@" + environment.appVersion,
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
   */
  public debug(message: any) {
    this.log(message, LogLevel.DEBUG);
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
   */
  public warn(message: any) {
    this.log(message, LogLevel.WARN);
  }

  /**
   * Log the message with "error" level - for unexpected critical events that cannot be handled and will affect functions.
   * @param message
   */
  public error(message: any) {
    this.log(message, LogLevel.ERROR);
  }

  /**
   * Generic logging of a message.
   * @param message Message to be logged
   * @param logLevel Optional log level - default is "info"
   */
  public log(message: any, logLevel: LogLevel = LogLevel.INFO) {
    this.logToConsole(message, logLevel);

    if (logLevel !== LogLevel.DEBUG && logLevel !== LogLevel.INFO) {
      this.logToRemoteMonitoring(message, logLevel);
    }
  }

  private logToConsole(message: any, logLevel: LogLevel) {
    switch (+logLevel) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
      default:
        console.log(message);
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
          message,
        );
      }
    } else {
      Sentry.captureMessage(message, this.translateLogLevel(logLevel));
    }
  }

  private translateLogLevel(logLevel: LogLevel): SeverityLevel {
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
