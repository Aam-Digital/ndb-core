import { LoggingModule } from './logging.module';

describe('LoggingModule', () => {
  let loggingModule: LoggingModule;

  beforeEach(() => {
    loggingModule = new LoggingModule();
  });

  it('should create an instance', () => {
    expect(loggingModule).toBeTruthy();
  });
});
