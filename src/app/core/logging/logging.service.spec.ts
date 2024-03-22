import { LoggingService } from "./logging.service";
import { LogLevel } from "./log-level";

describe("LoggingService", () => {
  const testMessage = "FANCY_TEST_MESSAGE";

  let loggingService: LoggingService;
  beforeEach(() => {
    loggingService = new LoggingService();
    spyOn<any>(loggingService, "logToConsole");
    spyOn<any>(loggingService, "logToRemoteMonitoring");
  });

  it("should be created", () => {
    expect(loggingService).toBeTruthy();
  });

  it("should log a debug message with additional context", function () {
    loggingService.debug(testMessage, "extra context");

    expect(loggingService["logToConsole"]).toHaveBeenCalledWith(
      testMessage,
      LogLevel.DEBUG,
      "extra context",
    );
    expect(loggingService["logToRemoteMonitoring"]).not.toHaveBeenCalled();
  });

  it("should log a info message", function () {
    loggingService.info(testMessage);

    expect(loggingService["logToConsole"]).toHaveBeenCalledWith(
      testMessage,
      LogLevel.INFO,
    );
    expect(loggingService["logToRemoteMonitoring"]).not.toHaveBeenCalled();
  });

  it("should log a warn message", function () {
    loggingService.warn(testMessage);

    expect(loggingService["logToConsole"]).toHaveBeenCalledWith(
      testMessage,
      LogLevel.WARN,
    );
    expect(loggingService["logToRemoteMonitoring"]).toHaveBeenCalledWith(
      testMessage,
      LogLevel.WARN,
    );
  });

  it("should log a error message", function () {
    loggingService.error(testMessage);

    expect(loggingService["logToConsole"]).toHaveBeenCalledWith(
      testMessage,
      LogLevel.ERROR,
    );
    expect(loggingService["logToRemoteMonitoring"]).toHaveBeenCalledWith(
      testMessage,
      LogLevel.ERROR,
    );
  });

  it("should log a message through the generic log method", function () {
    loggingService.log(testMessage, LogLevel.WARN);

    expect(loggingService["logToConsole"]).toHaveBeenCalledWith(
      testMessage,
      LogLevel.WARN,
    );
    expect(loggingService["logToRemoteMonitoring"]).toHaveBeenCalledWith(
      testMessage,
      LogLevel.WARN,
    );
  });
});
