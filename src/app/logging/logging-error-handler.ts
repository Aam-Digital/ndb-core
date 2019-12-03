import {ErrorHandler, Injectable} from '@angular/core';
import {LoggingService} from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class LoggingErrorHandler implements ErrorHandler {
  constructor(private logger: LoggingService) {}

  handleError(error) {
    this.logger.error(error);
    // It is possible to show a feedback dialog to the user through Sentry:
    // const eventId = Sentry.captureException(error.originalError || error);
    // Sentry.showReportDialog({ eventId });
  }
}
