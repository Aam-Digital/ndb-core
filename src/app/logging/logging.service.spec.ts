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
  let loggingService: LoggingServiceRavenMock;
  beforeEach(() => {
    loggingService = new LoggingServiceRavenMock();
  });

  it('should be created', () => {
    expect(loggingService).toBeTruthy();
  });

  it('should log a debug message', function () {
    const message = 'Debug Message';
    loggingService.debug(message);

    const receivedLogRequest = loggingService.latestRavenCalls.pop();

    expect(receivedLogRequest[0]).toEqual(message);
    expect(receivedLogRequest[1].level).toEqual('debug');
  });

  it('should log a info message', function () {
    const message = 'Info Message';
    loggingService.info(message);

    const receivedLogRequest = loggingService.latestRavenCalls.pop();

    expect(receivedLogRequest[0]).toEqual(message);
    expect(receivedLogRequest[1].level).toEqual('info');
  });

  it('should log a warn message', function () {
    const message = 'Warn Message';
    loggingService.warn(message);

    const receivedLogRequest = loggingService.latestRavenCalls.pop();

    expect(receivedLogRequest[0]).toEqual(message);
    expect(receivedLogRequest[1].level).toEqual('warn');
  });


  it('should log a error message', function () {
    const message = 'Error Message';
    loggingService.error(message);

    const receivedLogRequest = loggingService.latestRavenCalls.pop();

    expect(receivedLogRequest[0]).toEqual(message);
    expect(receivedLogRequest[1].level).toEqual('error');
  });

});
