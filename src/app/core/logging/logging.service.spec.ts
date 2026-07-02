import { LogLevel } from "./log-level";
import {
  LoggingService,
  MAX_REPEATED_SENTRY_EVENTS,
  processSentryEvent,
} from "./logging.service";

describe("LoggingService", () => {
  const testMessage = "FANCY_TEST_MESSAGE";

  let loggingService: LoggingService;
  beforeEach(() => {
    loggingService = new LoggingService();
    vi.spyOn(loggingService as any, "logToConsole");
    vi.spyOn(loggingService as any, "logToRemoteMonitoring");
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

  describe("processSentryEvent (beforeSend)", () => {
    it("should drop an identical event after MAX_REPEATED_SENTRY_EVENTS occurrences", () => {
      const event = () =>
        ({
          exception: {
            values: [{ type: "Error", value: "repeated failure A" }],
          },
        }) as any;

      for (let i = 0; i < MAX_REPEATED_SENTRY_EVENTS; i++) {
        expect(processSentryEvent(event(), {})).not.toBeNull();
      }
      expect(processSentryEvent(event(), {})).toBeNull();
      expect(processSentryEvent(event(), {})).toBeNull();
    });

    it("should not drop a different event after another event was capped", () => {
      const repeated = () =>
        ({
          exception: {
            values: [{ type: "Error", value: "repeated failure B" }],
          },
        }) as any;
      for (let i = 0; i < MAX_REPEATED_SENTRY_EVENTS + 2; i++) {
        processSentryEvent(repeated(), {});
      }

      const other = {
        exception: { values: [{ type: "Error", value: "different failure" }] },
      } as any;
      expect(processSentryEvent(other, {})).not.toBeNull();
    });

    it("should count message-only events (captureMessage) separately by message", () => {
      const messageEvent = () => ({ message: "repeated warning C" }) as any;

      for (let i = 0; i < MAX_REPEATED_SENTRY_EVENTS; i++) {
        expect(processSentryEvent(messageEvent(), {})).not.toBeNull();
      }
      expect(processSentryEvent(messageEvent(), {})).toBeNull();
    });
  });
});
