import {LoggingService} from './logging.service';
import * as Raven from 'raven-js';

class LoggingServiceRavenMock extends LoggingService {

  public latestRavenCalls: Array<[string, Raven.RavenOptions]>;

  constructor() {
    super();
    this.latestRavenCalls = [];
  }

  protected ravenCaptureMessage(message: string, options: Raven.RavenOptions): void {
    this.latestRavenCalls.push([message, options]);
  }
}


describe('LoggingService', () => {
  const testMessage = 'FANCY_TEST_MESSAGE';

  let loggingService: LoggingServiceRavenMock;
  beforeEach(() => {
    loggingService = new LoggingServiceRavenMock();
  });

  function checkReceivedLogMessage(level: Raven.LogLevel) {
    const receivedLogRequest = loggingService.latestRavenCalls.pop();
    expect(receivedLogRequest[0]).toEqual(testMessage);
    expect(receivedLogRequest[1].level).toEqual(level);
  }

  it('should be created', () => {
    expect(loggingService).toBeTruthy();
  });

  it('should log a debug message', function () {
    loggingService.debug(testMessage);

    checkReceivedLogMessage('debug');
  });

  it('should log a info message', function () {
    loggingService.info(testMessage);

    checkReceivedLogMessage('info');
  });

  it('should log a warn message', function () {
    loggingService.warn(testMessage);

    checkReceivedLogMessage('warn');
  });


  it('should log a error message', function () {
    loggingService.error(testMessage);

    checkReceivedLogMessage('error');
  });
});
