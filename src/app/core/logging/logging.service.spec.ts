import type * as Sentry from "@sentry/angular";
import { HttpErrorResponse } from "@angular/common/http";
import { LogLevel } from "./log-level";
import { toReportedError } from "./logging.service";
import { LoggedError, NamedError } from "./reported-errors";
import {
  MAX_REPEATED_SENTRY_EVENTS,
  processSentryEvent,
  resetSentryEventCounts,
} from "./sentry-event-processing";
import { normalizeErrorValue } from "./sentry-grouping";
import { DatabaseException } from "../database/pouchdb/database-exception";
import { RegistryLookupError } from "#src/app/core/config/registry/dynamic-registry";

/** The event Sentry builds for an error: its `cause` chain innermost-first. */
function eventFor(error: Error, withStack = false): Sentry.ErrorEvent {
  const chain: Error[] = [];
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    chain.unshift(e);
  }
  const stacktrace = withStack
    ? { frames: [{ filename: "app.ts" }] }
    : undefined;
  return {
    exception: {
      values: chain.map((e) => ({
        type: e.name,
        value: e.message,
        stacktrace,
      })),
    },
  } as Sentry.ErrorEvent;
}

function process(error: Error, withStack = false) {
  return processSentryEvent(eventFor(error, withStack), {
    originalException: error,
  });
}

/** How Sentry titles an event: by its thrown error. */
function title(event: Sentry.ErrorEvent): string {
  const values = event.exception.values;
  const thrown = values[values.length - 1];
  return `${thrown.type}: ${thrown.value}`;
}

const failedFetch = () =>
  new DatabaseException({ message: "Failed to fetch from DB" });

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

  it("should report an error logged directly as it is", () => {
    expect(toReportedError(failure, [], LogLevel.WARN)).toBe(failure);
  });
});

describe("normalizeErrorValue", () => {
  it.each([
    [
      "Http failure response for https://example.org/db/app/Child:1: 404 Not Found",
      "Http failure response for <url> <n> Not Found",
    ],
    [
      "Missing document Child:7f3a2b1c-1d2e-4f5a-8b9c-0d1e2f3a4b5c",
      "Missing document <entityId>",
    ],
    [
      "Missing revision 3-a1b2c3d4e5f60718293a4b5c6d7e8f90",
      "Missing revision <rev>",
    ],
    ["No user entity User:some.person", "No user entity <entityId>"],
    ["TypeError: x is undefined", "TypeError: x is undefined"],
    [
      'Server returned code 413 with body "<html><title>413 Too Large</title></html>"',
      "Server returned code <n>",
    ],
  ])("should normalize %j to %j", (value, expected) => {
    expect(normalizeErrorValue(value)).toBe(expected);
  });
});

describe("processSentryEvent", () => {
  beforeEach(() => {
    resetSentryEventCounts();
    vi.stubGlobal("navigator", { onLine: true });
  });
  afterEach(() => vi.unstubAllGlobals());

  describe("grouping", () => {
    it.each([
      {
        case: "a named error, by name and root cause",
        error: new NamedError(
          "ConfigLoadError",
          "Failed to load configuration.",
          { cause: new DatabaseException({ message: "Unknown kid" }) },
        ),
        fingerprint: [
          "ConfigLoadError",
          "failed to load configuration",
          "DatabaseException",
          "unknown kid",
        ],
        title:
          "ConfigLoadError: Failed to load configuration. (caused by DatabaseException: Unknown kid)",
      },
      {
        case: "a named error caused by a network failure, in an issue of its own",
        error: new NamedError(
          "AppBootstrapError",
          "Application Bootstrap failed",
          {
            cause: new TypeError(
              "Failed to fetch dynamically imported module: https://example.org/chunk-A1.js",
            ),
          },
        ),
        fingerprint: [
          "AppBootstrapError",
          "application bootstrap failed",
          "TypeError",
          "network failure",
        ],
        title:
          "AppBootstrapError: Application Bootstrap failed (caused by TypeError: network failure)",
      },
      {
        case: "a failed database request, in the network issue",
        error: new DatabaseException({ message: "Load failed" }),
        fingerprint: ["network-error"],
        title: "NetworkError: Failed to reach the server",
      },
      {
        case: "a logged failed request, in the network issue whoever logged it",
        error: new LoggedError("Could not load notes", failedFetch()),
        fingerprint: ["network-error"],
        title: "NetworkError: Failed to reach the server",
      },
      {
        case: "a logged chunk load failure, in the network issue",
        error: new LoggedError(
          "Failed to load dynamic component",
          new TypeError("Importing a module script failed."),
        ),
        fingerprint: ["network-error"],
        title: "NetworkError: Failed to reach the server",
      },
      {
        case: "a logged other failure, by message and root cause",
        error: new LoggedError(
          "Could not load notes",
          new DatabaseException({ message: "Unauthorized" }),
        ),
        fingerprint: [
          "Error",
          "could not load notes",
          "DatabaseException",
          "unauthorized",
        ],
        title:
          "Error: Could not load notes (caused by DatabaseException: Unauthorized)",
      },
      {
        // Angular re-throws an error raised in a `resource()` loader as its own
        case: "a named error re-wrapped by a framework, like the unwrapped one",
        error: new Error("Requested item is not registered in EntityRegistry", {
          cause: new RegistryLookupError("EntityRegistry", "Child"),
        }),
        fingerprint: [
          "RegistryLookupError",
          "requested item is not registered in entityregistry",
        ],
        title:
          "RegistryLookupError: Requested item is not registered in EntityRegistry",
      },
      {
        case: "a generic error without a stack, by its normalized message",
        error: new Error(
          "Missing document Child:7f3a2b1c-1d2e-4f5a-8b9c-0d1e2f3a4b5c",
        ),
        fingerprint: ["Error", "missing document <entityid>"],
        title: "Error: Missing document <entityId>",
      },
    ])("should group $case", ({ error, fingerprint, title: expected }) => {
      const event = process(error);

      expect(event.fingerprint).toEqual(fingerprint);
      expect(title(event)).toBe(expected);
    });

    it.each([
      ["a failed request", new TypeError("Load failed"), ["network-error"]],
      ["a bug", new TypeError("x is undefined"), undefined],
    ])(
      "should leave a generic error with a stack to Sentry, unless it is %s",
      (_, error, fingerprint) => {
        expect(process(error, true).fingerprint).toEqual(fingerprint);
      },
    );

    it("should keep the logged message and the original error of a network failure searchable", () => {
      const event = process(
        new LoggedError("Could not load notes", failedFetch()),
      );

      expect(event.level).toBe("warning");
      expect(event.tags).toMatchObject({
        logged_message: "Could not load notes",
        network_error: "DatabaseException: Failed to fetch from DB",
      });
    });

    it("should group a message event by its normalized message", () => {
      const event = processSentryEvent(
        { message: "Config refers to 3 unknown fields." } as Sentry.ErrorEvent,
        {},
      );

      expect(event.fingerprint).toEqual([
        "config refers to <n> unknown fields",
      ]);
    });
  });

  describe("dropping events nobody can act on", () => {
    const expiredSession = () =>
      new DatabaseException({
        status: 401,
        reason: "exp not in future",
        message: "unauthorized",
      });

    it.each([
      {
        case: "a connectivity failure while offline",
        error: Object.assign(new Error("signal is aborted"), {
          name: "AbortError",
        }),
        offline: true,
        dropped: true,
      },
      {
        case: "a connectivity failure while online",
        error: failedFetch(),
        offline: false,
        dropped: false,
      },
      {
        case: "a rejected write, by its status",
        error: new LoggedError(
          "Could not save",
          new DatabaseException({ message: "conflict", status: 409 }),
        ),
        dropped: true,
      },
      {
        case: "a rejected write, by PouchDB's wording",
        error: new Error("Document update conflict."),
        dropped: true,
      },
      {
        case: "an expired session, also when wrapped",
        error: new NamedError("ConfigLoadError", "Failed to load", {
          cause: expiredSession(),
        }),
        dropped: true,
      },
      {
        case: "another 401",
        error: new DatabaseException({
          status: 401,
          reason: "Unknown kid",
          message: "unauthorized",
        }),
        dropped: false,
      },
    ])("should drop $case: $dropped", ({ error, offline, dropped }) => {
      vi.stubGlobal("navigator", { onLine: !offline });

      expect(process(error) === null).toBe(dropped);
    });
  });

  it("should drop an unhandled error raised only by a script inlined into the page (e.g. injected by an in-app browser)", () => {
    const pageFrame = {
      filename: "https://x.aam-digital.app/public-form/form/mentor",
    };
    const unhandled = (frames: { filename: string }[]) =>
      processSentryEvent(
        {
          exception: {
            values: [
              {
                type: "RangeError",
                value: "Maximum call stack size exceeded.",
                mechanism: { type: "onerror", handled: false },
                stacktrace: { frames },
              },
            ],
          },
        } as Sentry.ErrorEvent,
        {},
      );

    expect(unhandled([pageFrame, pageFrame])).toBeNull();
    // any frame in one of our script files: keep it
    expect(
      unhandled([
        { filename: "https://x.aam-digital.app/main-ABC.js" },
        pageFrame,
      ]),
    ).not.toBeNull();
  });

  it.each([
    {
      case: "of the failed request underneath a wrapper",
      error: new NamedError("ConfigLoadError", "Failed to load", {
        cause: new DatabaseException({ status: 401, reason: "Unknown kid" }),
      }),
      extra: { name: "ConfigLoadError", status: 401, reason: "Unknown kid" },
    },
    {
      case: "a library nested inside a Response",
      error: Object.assign(
        new Error("Server responded with an invalid status."),
        {
          response: { status: 403 },
        },
      ),
      extra: { status: 403 },
    },
    {
      case: "a named error keeps out of its message",
      error: new RegistryLookupError("EntityRegistry", "Child"),
      extra: { registry: "EntityRegistry", registryKey: "Child" },
    },
  ])("should report the details $case", ({ error, extra }) => {
    expect(process(error).extra).toMatchObject(extra);
  });

  it("should cap the events of one issue per session, without silencing other issues", () => {
    const repeated = () => process(new Error("Repeated failure"));
    for (let i = 0; i < MAX_REPEATED_SENTRY_EVENTS; i++) {
      expect(repeated()).not.toBeNull();
    }

    expect(repeated()).toBeNull();
    expect(process(new Error("Another failure"))).not.toBeNull();
  });
});
