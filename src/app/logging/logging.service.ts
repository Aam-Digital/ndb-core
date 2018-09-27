import {Injectable} from '@angular/core';
import * as Raven from 'raven-js';
import {LogLevel  as RavenLogLevel, RavenOptions} from 'raven-js';
import {LogLevel} from './log-level';


Raven
  .config('https://bd6aba79ca514d35bb06a4b4e0c2a21e@sentry.io/1242399')
  .install();

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  constructor() {
  }

  public log(message: string, logLevel: LogLevel) {
    let options: RavenOptions;
    options = {};
    options.level = this.translateLogLevel(logLevel);

    this.ravenCaptureMessage(message, options);
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

  private translateLogLevel(logLevel: LogLevel): RavenLogLevel {

    let retVal: RavenLogLevel;
    switch (+logLevel) {
      case LogLevel.DEBUG:
        retVal = 'debug';
        break;
      case LogLevel.INFO:
        retVal = 'info';
        break;
      case LogLevel.WARN:
        retVal = 'warn';
        break;
      case LogLevel.ERROR:
        retVal = 'error';
        break;
    }

    return retVal;
  }

  protected ravenCaptureMessage(message: string,
                                options: RavenOptions) {
    Raven.captureMessage(message, options);
  }
}
