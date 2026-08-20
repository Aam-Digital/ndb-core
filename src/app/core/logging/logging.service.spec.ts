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

    describe("grouping fingerprint", () => {
      const chainedEvent = (
        rootCause: { type: string; value: string },
        thrown: { type: string; value: string },
      ) =>
        ({
          // Sentry orders the chain innermost-first: the thrown error is last
          exception: { values: [rootCause, thrown] },
        }) as any;

      it("should group our wrapper errors by thrown error and root cause", () => {
        const event = processSentryEvent(
          chainedEvent(
            { type: "DatabaseException", value: "Failed to fetch from DB" },
            {
              type: "ConfigLoadError",
              value: "Failed to load configuration from the database.",
            },
          ),
          {},
        );

        expect(event.fingerprint).toEqual([
          "ConfigLoadError",
          "Failed to load configuration from the database.",
          "DatabaseException",
          "Failed to fetch from DB",
        ]);
      });

      it("should give the same wrapper error a different fingerprint per root cause", () => {
        const offline = processSentryEvent(
          chainedEvent(
            { type: "DatabaseException", value: "Failed to fetch from DB" },
            { type: "ConfigLoadError", value: "Failed to load configuration." },
          ),
          {},
        );
        const unauthorized = processSentryEvent(
          chainedEvent(
            { type: "DatabaseException", value: "unauthorized" },
            { type: "ConfigLoadError", value: "Failed to load configuration." },
          ),
          {},
        );

        expect(offline.fingerprint).not.toEqual(unauthorized.fingerprint);
      });

      it("should mask ids, urls and numbers so the same problem matches", () => {
        const withId = processSentryEvent(
          {
            exception: {
              values: [
                {
                  type: "DatabaseException",
                  value:
                    'Document update conflict. ID: "8f2b1c7e-1234-4a5b-9c8d-0e1f2a3b4c5d"',
                },
              ],
            },
          } as any,
          {},
        );
        const withOtherId = processSentryEvent(
          {
            exception: {
              values: [
                {
                  type: "DatabaseException",
                  value:
                    'Document update conflict. ID: "1a2b3c4d-9999-4eee-8fff-abcdef012345"',
                },
              ],
            },
          } as any,
          {},
        );

        expect(withId.fingerprint).toEqual(withOtherId.fingerprint);
      });

      it("should give a self-wrapping error the same fingerprint as the unwrapped one", () => {
        const cause = {
          type: "DatabaseException",
          value: "database is destroyed",
        };

        const unwrapped = processSentryEvent(
          { exception: { values: [cause] } } as any,
          {},
        );
        const selfWrapped = processSentryEvent(
          chainedEvent({ ...cause }, { ...cause }),
          {},
        );

        expect(selfWrapped.fingerprint).toEqual(unwrapped.fingerprint);
      });

      it("should group a registry lookup by key, not by the call site's stack", () => {
        const lookupEvent = (key: string) =>
          ({
            exception: {
              values: [
                {
                  type: "RegistryLookupError",
                  value: `Requested item is not registered in EntityRegistry. Key: ${key}`,
                },
              ],
            },
          }) as any;

        const fromPipe = processSentryEvent(lookupEvent("Event"), {});
        const fromImport = processSentryEvent(lookupEvent("Event"), {});
        const otherKey = processSentryEvent(lookupEvent("Child"), {});

        expect(fromPipe.fingerprint).toEqual(fromImport.fingerprint);
        // a different missing registration is a different problem to fix
        expect(otherKey.fingerprint).not.toEqual(fromPipe.fingerprint);
      });

      it("should not fingerprint generic errors, keeping Sentry's stack-based grouping", () => {
        const event = processSentryEvent(
          {
            exception: {
              values: [{ type: "TypeError", value: "x is not a function" }],
            },
          } as any,
          {},
        );

        expect(event.fingerprint).toBeUndefined();
      });

      it("should not fingerprint message-only events", () => {
        const event = processSentryEvent(
          { message: "some static warning" } as any,
          {},
        );

        expect(event.fingerprint).toBeUndefined();
      });
    });

    describe("offline network errors", () => {
      afterEach(() => vi.unstubAllGlobals());

      const networkErrorEvent = () =>
        ({
          exception: {
            values: [
              { type: "DatabaseException", value: "Failed to fetch from DB" },
            ],
          },
        }) as any;

      it("should drop network fetch failures while offline", () => {
        vi.stubGlobal("navigator", { onLine: false });

        expect(processSentryEvent(networkErrorEvent(), {})).toBeNull();
      });

      it("should keep network fetch failures while online", () => {
        vi.stubGlobal("navigator", { onLine: true });

        expect(processSentryEvent(networkErrorEvent(), {})).not.toBeNull();
      });

      it("should keep non-network errors while offline", () => {
        vi.stubGlobal("navigator", { onLine: false });

        const otherEvent = {
          exception: {
            values: [{ type: "Error", value: "some application bug" }],
          },
        } as any;
        expect(processSentryEvent(otherEvent, {})).not.toBeNull();
      });
    });
  });
});
