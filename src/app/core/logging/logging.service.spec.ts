import { isInitialized } from "@sentry/angular";
import { HttpErrorResponse } from "@angular/common/http";
import { LogLevel } from "./log-level";
import { LoggingService, toReportedError } from "./logging.service";
import { LoggedError, NamedError } from "./reported-errors";
import { ConnectivityError, NotPermittedError } from "./error-classification";
import { DatabaseException } from "../database/pouchdb/database-exception";

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
    [
      "a wrapped missing permission",
      new NamedError("SomeError", "x", {
        cause: new NotPermittedError("forbidden"),
      }),
      "debug",
    ],
    [
      "an edit conflict",
      new DatabaseException({ status: 409, message: "conflict" }),
      "debug",
    ],
    [
      "a 401 for an invalid token",
      new DatabaseException({
        status: 401,
        reason: "Token signature is not valid",
      }),
      "warn",
    ],
    // converted into a typed error where it enters the app, not judged here
    [
      "a failed fetch that passed no boundary",
      new TypeError("Failed to fetch"),
      "warn",
    ],
    ["a server error", new HttpErrorResponse({ status: 500 }), "warn"],
    ["a bug", new TypeError("x is undefined"), "warn"],
  ] as const)(
    "should log a failure that is %s at %s level with warnUnlessExpected",
    (_, err, level) => {
      const logging = new LoggingService();
      vi.spyOn(logging, "debug").mockImplementation(() => undefined);
      vi.spyOn(logging, "warn").mockImplementation(() => undefined);

      logging.warnUnlessExpected("Could not load X", err, "Child:1");

      expect(logging[level]).toHaveBeenCalledWith(
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
