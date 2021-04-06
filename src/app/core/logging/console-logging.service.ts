import { LoggingService } from "./logging.service";
import { LogLevel } from "./log-level";

export class ConsoleLoggingService extends LoggingService {
  public log(message: string, logLevel: LogLevel) {
    switch (logLevel) {
      case LogLevel.DEBUG:
        this.debug(message);
        break;
      case LogLevel.INFO:
        this.info(message);
        break;
      case LogLevel.WARN:
        this.warn(message);
        break;
      case LogLevel.ERROR:
        this.error(message);
        break;
    }
  }

  public debug(message: string) {
    console.debug(message);
  }

  public info(message: string) {
    console.info(message)
  }

  public warn(message: string) {
    console.warn(message);
  }

  public error(message: string) {
    console.error(message);
  }
}
