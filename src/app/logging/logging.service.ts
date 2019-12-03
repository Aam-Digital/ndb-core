import {Injectable} from '@angular/core';
import {LogLevel} from './log-level';
import * as Sentry from '@sentry/browser';


Sentry.init({
  dsn: 'https://bd6aba79ca514d35bb06a4b4e0c2a21e@sentry.io/1242399',
  whitelistUrls: [
    /https?:\/\/(.*)\.?aam-digital\.com/
  ]
});

/* tslint:disable:no-console */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  constructor() {
  }


  public debug(message: string) {
    this.log(message, LogLevel.DEBUG);
  }

  public info(message: string) {
    this.log(message, LogLevel.INFO);
  }

  public warn(message: string) {
    this.log(message, LogLevel.WARN);
  }

  public error(message: string) {
    this.log(message, LogLevel.ERROR);
  }


  public log(message: string, logLevel: LogLevel = LogLevel.INFO) {
    this.logToConsole(message, logLevel);
    this.logToRemoteMonitoring(message, logLevel);
  }

  private logToConsole(message: string, logLevel: LogLevel) {
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

  private logToRemoteMonitoring(message: string, logLevel: LogLevel) {
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
