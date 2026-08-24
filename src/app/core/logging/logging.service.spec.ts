import { LogLevel } from "./log-level";
import {
  LoggedError,
  LoggingService,
  MAX_REPEATED_SENTRY_EVENTS,
  processSentryEvent,
  toReportedError,
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

  describe("reporting errors to remote monitoring", () => {
    it("should report a thrown Error as it is", () => {
      const err = new Error("some failure");

      expect(toReportedError(err, [])).toBe(err);
    });

    it("should report the log message as the error, keeping the original as its cause", () => {
      const cause = new Error("Failed to fetch");

      const reported = toReportedError("Could not download file", [cause]);

      expect(reported).toBeInstanceOf(LoggedError);
      // the message identifies the problem better than the underlying error and
      // becomes both the issue title and (through the fingerprint) the grouping key
      expect(reported.message).toBe("Could not download file");
      // Sentry links the cause into the reported chain, so its stack is not lost
      expect(reported.cause).toBe(cause);
    });
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

    it("should budget repeats per issue, so one problem does not silence another", () => {
      // both wrappers share a root cause, as everything does while a device is
      // on a flaky connection - but they are separate issues to be reported
      const wrapped = (type: string) =>
        ({
          exception: {
            values: [
              { type: "DatabaseException", value: "Failed to fetch from DB" },
              { type, value: `Failed to load the ${type} document` },
            ],
          },
        }) as any;

      for (let i = 0; i < MAX_REPEATED_SENTRY_EVENTS; i++) {
        expect(
          processSentryEvent(wrapped("ConfigLoadError"), {}),
        ).not.toBeNull();
      }
      expect(processSentryEvent(wrapped("ConfigLoadError"), {})).toBeNull();

      expect(
        processSentryEvent(wrapped("PermissionRulesLoadError"), {}),
      ).not.toBeNull();
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
            { type: "DatabaseException", value: "Unknown kid" },
            {
              type: "ConfigLoadError",
              value: "Failed to load configuration from the database.",
            },
          ),
          {},
        );

        expect(event.fingerprint).toEqual([
          "ConfigLoadError",
          "failed to load configuration from the database",
          "DatabaseException",
          "unknown kid",
        ]);
      });

      it("should group a wrapper error by the problem, however the browser worded a failed request", () => {
        const chrome = processSentryEvent(
          {
            exception: {
              values: [
                { type: "DatabaseException", value: "Failed to fetch from DB" },
              ],
            },
          } as any,
          {},
        );
        const safari = processSentryEvent(
          {
            exception: {
              values: [{ type: "DatabaseException", value: "Load failed" }],
            },
          } as any,
          {},
        );
        // the same failure, reported with the browser's error still in the chain
        const chained = processSentryEvent(
          chainedEvent(
            { type: "TypeError", value: "Failed to fetch" },
            { type: "DatabaseException", value: "Failed to fetch from DB" },
          ),
          {},
        );

        expect(safari.fingerprint).toEqual(chrome.fingerprint);
        expect(chained.fingerprint).toEqual(chrome.fingerprint);
        // ... reported under a title that does not depend on the browser
        expect(safari.exception.values[0].value).toBe(
          "Failed to reach the server",
        );
        expect(safari.extra.originalError).toBe("Load failed");
      });

      it("should keep wrapper errors with a different kind of root cause apart", () => {
        const offline = processSentryEvent(
          chainedEvent(
            { type: "DatabaseException", value: "Load failed" },
            { type: "ConfigLoadError", value: "Failed to load configuration" },
          ),
          {},
        );
        const missingKey = processSentryEvent(
          chainedEvent(
            { type: "DatabaseException", value: "Unknown kid" },
            { type: "ConfigLoadError", value: "Failed to load configuration" },
          ),
          {},
        );

        expect(offline.fingerprint).not.toEqual(missingKey.fingerprint);
        expect(offline.exception.values[1].value).toBe(
          "Failed to load configuration (caused by DatabaseException: network failure)",
        );
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
            { type: "DatabaseException", value: "Access denied" },
            { type: "ConfigLoadError", value: "Failed to load configuration." },
          ),
          {},
        );

        expect(offline.fingerprint).not.toEqual(unauthorized.fingerprint);
      });

      it("should name the root cause in the message, so that issues split by it are distinguishable", () => {
        const event = processSentryEvent(
          chainedEvent(
            { type: "DatabaseException", value: "Unknown kid" },
            {
              type: "ConfigLoadError",
              value: "Failed to load configuration.",
            },
          ),
          {},
        );

        expect(event.exception.values[1].value).toBe(
          "Failed to load configuration. (caused by DatabaseException: Unknown kid)",
        );
      });

      it("should keep the message of an error that has no distinct root cause", () => {
        const event = processSentryEvent(
          {
            exception: {
              values: [
                { type: "DatabaseException", value: "Document not found" },
              ],
            },
          } as any,
          {},
        );

        expect(event.exception.values[0].value).toBe("Document not found");
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

      it("should ignore punctuation and casing, which third-party errors are inconsistent about", () => {
        const conflictEvent = (value: string) =>
          ({
            exception: { values: [{ type: "DatabaseException", value }] },
          }) as any;

        const withPeriod = processSentryEvent(
          conflictEvent("Document update conflict. (unable to resolve)"),
          {},
        );
        const withoutPeriod = processSentryEvent(
          conflictEvent("Document update conflict (unable to resolve)"),
          {},
        );
        const lowercased = processSentryEvent(
          conflictEvent("document update conflict (unable to resolve)"),
          {},
        );

        expect(withoutPeriod.fingerprint).toEqual(withPeriod.fingerprint);
        expect(lowercased.fingerprint).toEqual(withPeriod.fingerprint);
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

      it("should group an error logged with a message by that message, not by the stack", () => {
        const loggedEvent = (frame: string) =>
          ({
            exception: {
              values: [
                {
                  type: "TypeError",
                  value: "cannot read property",
                  stacktrace: { frames: [{ filename: frame }] },
                },
                { type: "Error", value: "Could not download file" },
              ],
            },
          }) as any;
        const hint = {
          originalException: new LoggedError("Could not download file"),
        } as any;

        const fromOneCallSite = processSentryEvent(loggedEvent("a.ts"), hint);
        const fromAnotherCallSite = processSentryEvent(
          loggedEvent("b.ts"),
          hint,
        );

        expect(fromOneCallSite.fingerprint).toEqual(
          fromAnotherCallSite.fingerprint,
        );
        expect(fromOneCallSite.fingerprint).toContain(
          "could not download file",
        );
      });

      it("should not fingerprint generic errors, keeping Sentry's stack-based grouping", () => {
        const event = processSentryEvent(
          {
            exception: {
              values: [
                {
                  type: "TypeError",
                  value: "x is not a function",
                  stacktrace: { frames: [{ filename: "some.component.ts" }] },
                },
              ],
            },
          } as any,
          {},
        );

        expect(event.fingerprint).toBeUndefined();
      });

      it("should fingerprint exceptions reported without a stack, which Sentry would split by message", () => {
        const httpEvent = (id: string) =>
          ({
            exception: {
              values: [
                {
                  type: "HttpErrorResponse",
                  value: `Http failure response for /db/app-attachments/Child:${id}/photo: 404 Not Found`,
                },
              ],
            },
          }) as any;

        const one = processSentryEvent(
          httpEvent("8f2b1c7e-1234-4a5b-9c8d-0e1f2a3b4c5d"),
          {},
        );
        const other = processSentryEvent(
          httpEvent("1a2b3c4d-9999-4eee-8fff-abcdef012345"),
          {},
        );

        expect(one.fingerprint).toEqual(other.fingerprint);
      });

      it("should group message-only events by their normalized message", () => {
        const one = processSentryEvent(
          { message: "Report failed after 12 rows" } as any,
          {},
        );
        const other = processSentryEvent(
          { message: "Report failed after 7 rows" } as any,
          {},
        );

        expect(one.fingerprint).toEqual(other.fingerprint);
      });
    });

    describe("network errors", () => {
      beforeEach(() => vi.stubGlobal("navigator", { onLine: true }));
      afterEach(() => vi.unstubAllGlobals());

      const fetchFailure = (value: string, filename: string) =>
        ({
          exception: {
            values: [
              {
                type: "TypeError",
                value,
                stacktrace: { frames: [{ filename }] },
              },
            ],
          },
        }) as any;

      it("should collect connectivity failures of any wording and call site in one issue", () => {
        const chrome = processSentryEvent(
          fetchFailure("Failed to fetch", "sync.ts"),
          {},
        );
        const safari = processSentryEvent(
          fetchFailure("Load failed", "file.service.ts"),
          {},
        );

        expect(chrome.fingerprint).toEqual(["network-error"]);
        expect(safari.fingerprint).toEqual(chrome.fingerprint);
      });

      it("should report a stable title and keep the original message searchable", () => {
        const event = processSentryEvent(
          fetchFailure(
            "NetworkError when attempting to fetch resource",
            "a.ts",
          ),
          {},
        );

        expect(event.exception.values[0].type).toBe("NetworkError");
        expect(event.exception.values[0].value).toBe(
          "Failed to reach the server",
        );
        expect(event.tags.network_error).toBe(
          "TypeError: NetworkError when attempting to fetch resource",
        );
        expect(event.extra.originalError).toBe(
          "NetworkError when attempting to fetch resource",
        );
      });

      it("should recognize a request that was aborted or timed out", () => {
        const event = processSentryEvent(
          {
            exception: {
              values: [
                {
                  type: "AbortError",
                  value: "signal is aborted without reason",
                  stacktrace: { frames: [{ filename: "b.ts" }] },
                },
              ],
            },
          } as any,
          {},
        );

        expect(event.fingerprint).toEqual(["network-error"]);
      });

      it("should keep a named error out of the network bucket, as its own message says more", () => {
        const event = processSentryEvent(
          {
            exception: {
              values: [
                { type: "DatabaseException", value: "Failed to fetch from DB" },
                {
                  type: "ConfigLoadError",
                  value: "Failed to load the configuration",
                },
              ],
            },
          } as any,
          {},
        );

        expect(event.fingerprint).toContain("ConfigLoadError");
        expect(event.fingerprint).not.toEqual(["network-error"]);
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
