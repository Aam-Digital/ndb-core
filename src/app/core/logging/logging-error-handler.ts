import { ErrorHandler, Injectable } from "@angular/core";
import { Logging } from "./logging.service";

/**
 * A simple ErrorHandler that logs any unhandled errors that occur in the app.
 * This is particularly useful if remote error logging with Sentry is set up so the development team receives such info.
 *
 * To enable this, add it as an ErrorHandler provider to your main AppModule's "providers" list:
 *
 * @example
 * { provide: ErrorHandler, useClass: LoggingErrorHandler }
 */
@Injectable()
export class LoggingErrorHandler implements ErrorHandler {
  /**
   * Handle until now uncaught error by logging it.
   * @param error
   */
  handleError(error) {
    Logging.error(error);
    // It is possible to show a feedback dialog to the user through Sentry:
    // const eventId = Sentry.captureException(error.originalError || error);
    // Sentry.showReportDialog({ eventId });
  }
}
