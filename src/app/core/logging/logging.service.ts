import { Injectable } from "@angular/core";
import { LogLevel } from "./log-level";
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://bd6aba79ca514d35bb06a4b4e0c2a21e@sentry.io/1242399",
  whitelistUrls: [/https?:\/\/(.*)\.?aam-digital\.com/],
});

/* tslint:disable:no-console */

/**
 * Centrally managed logging to allow log messages to be filtered by level and even sent to a remote logging service
 * that allows developers to monitor and analyse problems.
 *
 * Logging to the remote monitoring server is set only for warnings and errors.
 */
@Injectable({
  providedIn: "root",
})
export class LoggingService {
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
    Sentry.captureMessage(message, this.translateLogLevel(logLevel));
  }

  private translateLogLevel(logLevel: LogLevel): Sentry.Severity {
    switch (+logLevel) {
      case LogLevel.DEBUG:
        return Sentry.Severity.Debug;
      case LogLevel.INFO:
        return Sentry.Severity.Info;
      case LogLevel.WARN:
        return Sentry.Severity.Warning;
      case LogLevel.ERROR:
        return Sentry.Severity.Error;
      default:
        return Sentry.Severity.Info;
    }
  }
}
