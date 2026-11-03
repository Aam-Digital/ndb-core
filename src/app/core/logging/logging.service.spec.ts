import { isInitialized } from "@sentry/angular";
import { HttpErrorResponse } from "@angular/common/http";
import { LogLevel } from "./log-level";
import { LoggingService, toReportedError } from "./logging.service";
import { LoggedError, NamedError } from "./reported-errors";
import { ConnectivityError } from "#src/app/utils/backend-errors";
import { NotPermittedError } from "#src/app/core/permissions/not-permitted.error";
import { DatabaseException } from "../database/pouchdb/database-exception";

/** A request to another service (not converted by the HTTP interceptor) without response. */
const offlineResponse = new HttpErrorResponse({ status: 0 });

describe("LoggingService", () => {
  const failure = new Error("Failed to fetch");

  it.each([
    {
      call: "an error with a message",
      level: LogLevel.ERROR,
      context: [failure],
      expected: { message: "Could not load X", cause: failure },
    },
    {
      call: "a warning with an error",
      level: LogLevel.WARN,
      context: ["Child:1", failure],
      expected: { message: "Could not load X", cause: failure },
    },
    {
      call: "an error without an error object",
      level: LogLevel.ERROR,
      context: [],
      expected: { message: "Could not load X", cause: undefined },
    },
    {
      call: "a warning with only data",
      level: LogLevel.WARN,
      context: [{ dataType: "School" }],
      expected: undefined,
    },
    {
      // not an Error: whether a failed response is exceptional is for the caller to decide
      call: "a warning with a failed HTTP response",
      level: LogLevel.WARN,
      context: [new HttpErrorResponse({ status: 404 })],
      expected: undefined,
    },
  ])(
    "should report $call as the logged message caused by the error (or as a plain message if undefined)",
    ({ level, context, expected }) => {
      const reported = toReportedError("Could not load X", context, level);

      if (expected === undefined) {
        expect(reported).toBeUndefined();
      } else {
        expect(reported).toBeInstanceOf(LoggedError);
        expect(reported).toMatchObject(expected);
      }
    },
  );

  it.each([
    [
      "offline",
      new ConnectivityError("Failed to fetch from DB", {
        cause: new TypeError("Failed to fetch"),
      }),
      "debug",
    ],
    ["a failed fetch that passed no boundary", failure, "debug"],
    ["a request to another service without response", offlineResponse, "debug"],
    [
      "an edit conflict",
      new DatabaseException({ status: 409, message: "conflict" }),
      "debug",
    ],
    [
      "a missing permission wrapped in a named error",
      new NamedError("SomeError", "x", {
        cause: new NotPermittedError("forbidden"),
      }),
      "warn",
    ],
    [
      "a 401 for an invalid token",
      new DatabaseException({
        status: 401,
        reason: "Token signature is not valid",
      }),
      "warn",
    ],
    ["a server error", new HttpErrorResponse({ status: 500 }), "warn"],
    // context data, not the error the log call is about
    ["a plain status object", { status: 0 }, "warn"],
    ["a bug", new TypeError("x is undefined"), "warn"],
  ] as const)(
    "should log a warning about %s at %s level",
    (_, err, consoleMethod) => {
      const consoleSpies = {
        debug: vi.spyOn(console, "debug").mockImplementation(() => undefined),
        warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
      };

      onTestFinished(() =>
        Object.values(consoleSpies).forEach((spy) => spy.mockRestore()),
      );

      new LoggingService().warn("Could not load X", err, "Child:1");

      expect(consoleSpies[consoleMethod]).toHaveBeenCalledWith(
        "Could not load X",
        err,
        "Child:1",
      );
    },
  );

  it("should report an error logged directly as it is", () => {
    expect(toReportedError(failure, [], LogLevel.WARN)).toBe(failure);
  });

  it.each([undefined, ""])(
    "should not set up remote logging without a DSN (%j)",
    (dsn) => {
      new LoggingService().initRemoteLogging({ dsn });

      expect(isInitialized()).toBe(false);
    },
  );
});
