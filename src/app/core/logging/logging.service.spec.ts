import type * as Sentry from "@sentry/angular";
import { isInitialized } from "@sentry/angular";
import { HttpErrorResponse } from "@angular/common/http";
import { LogLevel } from "./log-level";
import { LoggingService, toReportedError } from "./logging.service";
import { LoggedError, NamedError } from "./reported-errors";
import { processSentryEvent } from "./sentry-event-processing";
import { MAX_REPEATED_SENTRY_EVENTS, resetReportedEvents } from "./report-once";
import { normalizeErrorValue } from "./sentry-grouping";
import {
  classifyError,
  ConnectivityError,
  ServerError,
} from "./error-classification";
import { DatabaseException } from "../database/pouchdb/database-exception";
import { RegistryLookupError } from "#src/app/core/config/registry/dynamic-registry";

type Frame = { function?: string; filename?: string };

/** The event Sentry builds for an error: its `cause` chain innermost-first. */
function eventFor(
  error: Error,
  options: { frames?: Frame[]; unhandled?: boolean } = {},
): Sentry.ErrorEvent {
  const chain: Error[] = [];
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    chain.unshift(e);
  }
  const stacktrace = options.frames ? { frames: options.frames } : undefined;
  const mechanism = { type: "generic", handled: !options.unhandled };
  return {
    exception: {
      values: chain.map((e, i) => ({
        type: e.name,
        value: e.message,
        stacktrace,
        mechanism: i === chain.length - 1 ? mechanism : undefined,
      })),
    },
  } as Sentry.ErrorEvent;
}

function process(
  error: Error,
  options?: { frames?: Frame[]; unhandled?: boolean },
) {
  return processSentryEvent(eventFor(error, options), {
    originalException: error,
  });
}

const withStack = { frames: [{ filename: "app.ts" }] };

/** How Sentry titles an event: by its thrown error. */
function title(event: Sentry.ErrorEvent): string {
  const values = event.exception.values;
  const thrown = values[values.length - 1];
  return `${thrown.type}: ${thrown.value}`;
}

/** What the remote database throws (wrapped by PouchDatabase) for a request without response. */
const failedFetch = () =>
  new DatabaseException(
    new ConnectivityError("Failed to fetch from DB", {
      cause: new TypeError("Failed to fetch"),
    }),
  );

/** PouchDB's error once the IndexedDB of the device is broken (AAM-DIGITAL-7CQ). */
const brokenIndexedDb = () =>
  Object.assign(new Error("unknown"), {
    name: "indexed_db_went_bad",
    status: 500,
    reason:
      "The requested version (5) is less than the existing version (21793192942062).",
  });

/** A raw browser error, e.g. IndexedDB closed underneath PouchDB (AAM-DIGITAL-5WD). */
const browserError = (name: string, message: string) =>
  Object.assign(new Error(message), { name });

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

  it.each([undefined, ""])(
    "should not set up remote logging without a DSN (%j)",
    (dsn) => {
      new LoggingService().initRemoteLogging({ dsn });

      expect(isInitialized()).toBe(false);
    },
  );
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

describe("classifyError", () => {
  it.each([
    [
      "a response that never arrived",
      new HttpErrorResponse({ status: 0 }),
      "connectivity",
    ],
    [
      "a gateway status",
      new HttpErrorResponse({ status: 503 }),
      "connectivity",
    ],
    ["a server error", new HttpErrorResponse({ status: 500 }), "server-error"],
    ["a 403", new HttpErrorResponse({ status: 403 }), "not-permitted"],
    [
      "a typed error, by its type rather than its wording",
      new ServerError("Failed to fetch from DB", { status: 500 }),
      "server-error",
    ],
    [
      "a raw browser error, by its wording",
      browserError(
        "InvalidStateError",
        "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.",
      ),
      "local-storage",
    ],
    [
      "a programming error in a database call, not as a broken database",
      browserError(
        "RangeError",
        "Failed to execute 'put' on 'IDBObjectStore': Maximum call stack size exceeded",
      ),
      undefined,
    ],
    [
      "a logged message, never by its wording",
      new LoggedError("Failed to fetch notifications"),
      undefined,
    ],
  ])("should classify %s", (_, error, expected) => {
    expect(classifyError(error)).toBe(expected);
  });
});

describe("processSentryEvent", () => {
  beforeEach(() => {
    resetReportedEvents();
    vi.stubGlobal("navigator", { onLine: true });
  });
  afterEach(() => vi.unstubAllGlobals());

  describe("grouping", () => {
    it.each([
      {
        case: "a named error with a generic root cause, by the error and its root cause",
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
        case: "a named error with a classified root cause, by its root cause",
        error: new NamedError(
          "ConfigLoadError",
          "Failed to load configuration.",
          {
            cause: new DatabaseException(
              new ServerError("Server error response from DB", { status: 500 }),
            ),
          },
        ),
        fingerprint: [
          "DatabaseException",
          "server error response from db",
          "500",
        ],
        title: "DatabaseException: Server error response from DB (HTTP 500)",
        reportedBy: "ConfigLoadError: Failed to load configuration.",
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
        case: "a logged other failure, by the message and its root cause",
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
        case: "a logged programming error, by the message and its root cause",
        error: new LoggedError(
          "Could not render",
          new TypeError("x is undefined"),
        ),
        fingerprint: [
          "Error",
          "could not render",
          "TypeError",
          "x is undefined",
        ],
        title: "Error: Could not render (caused by TypeError: x is undefined)",
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
    ])(
      "should group $case",
      ({ error, fingerprint, title: expected, reportedBy }) => {
        const event = process(error);

        expect(event.fingerprint).toEqual(fingerprint);
        expect(title(event)).toBe(expected);
        expect(event.tags?.reported_by).toBe(reportedBy);
      },
    );

    it("should group one classified root cause logged by different components into one issue, telling the components apart by tag", () => {
      // like AAM-DIGITAL-7CQ, 7CR, 77R: one broken local database, one issue
      const bySync = process(
        new LoggedError(
          "sync failed",
          new DatabaseException(brokenIndexedDb()),
        ),
      );
      resetReportedEvents(); // the next page load
      const byPermissions = process(
        new LoggedError(
          "Failed to load permission rules",
          new DatabaseException(brokenIndexedDb()),
        ),
      );

      expect(bySync.fingerprint).toEqual(byPermissions.fingerprint);
      expect(bySync.tags.reported_by).toBe("Error: sync failed");
      expect(byPermissions.tags.reported_by).toBe(
        "Error: Failed to load permission rules",
      );
    });

    it.each([
      [
        "a missing document",
        () => new DatabaseException({ status: 404, message: "missing" }),
      ],
      [
        "a programming error",
        () =>
          new TypeError(
            "Cannot read properties of undefined (reading 'length')",
          ),
      ],
    ])(
      "should keep %s logged by different components in issues of their own, whatever library function threw it",
      (_, rootCause) => {
        const loggedBy = (message: string) =>
          process(new LoggedError(message, rootCause()), {
            // e.g. thrown in a callback of `Array.map`
            frames: [{ function: "Array.map", filename: "<anonymous>" }],
          }).fingerprint;

        expect(loggedBy("Could not load school")).not.toEqual(
          loggedBy("Failed to load config"),
        );
      },
    );

    it.each([
      ["a failed request", new TypeError("Load failed"), ["network-error"]],
      ["a bug", new TypeError("x is undefined"), undefined],
    ])(
      "should leave a generic error with a stack to Sentry, unless it is %s",
      (_, error, fingerprint) => {
        expect(process(error, withStack).fingerprint).toEqual(fingerprint);
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
      {
        case: "a record the permission rules exclude, reaching the error handler",
        error: new DatabaseException({ status: 403, message: "forbidden" }),
        dropped: true,
      },
      {
        case: "a record the permission rules exclude, logged by a component",
        error: new LoggedError(
          "Could not load record",
          new DatabaseException({ status: 403, message: "forbidden" }),
        ),
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

  it.each([
    {
      case: "a server error, as an error with its status",
      error: new LoggedError(
        "Could not load notes",
        new DatabaseException(
          new ServerError("Server error response from DB", { status: 500 }),
        ),
      ),
      level: "error",
      title: "DatabaseException: Server error response from DB (HTTP 500)",
      tags: { http_status: "500", error_class: "server-error" },
    },
    {
      case: "a server error logged as a warning, at the level it was logged with",
      error: new LoggedError(
        "Could not load notes",
        new DatabaseException(
          new ServerError("Server error response from DB", { status: 500 }),
        ),
      ),
      loggedLevel: "warning",
      level: "warning",
      title: "DatabaseException: Server error response from DB (HTTP 500)",
      tags: { http_status: "500", error_class: "server-error" },
    },
    {
      case: "an unhandled not-permitted failure, as a warning",
      // e.g. a public form re-throwing the failed save of a record the public role may not create
      error: new Error("Could not save Note: forbidden", {
        cause: new DatabaseException({ status: 403, message: "forbidden" }),
      }),
      unhandled: true,
      level: "warning",
      title: "Error: Could not save Note: forbidden",
      tags: { error_class: "not-permitted" },
    },
    {
      case: "a logged not-permitted failure, as a warning",
      error: new LoggedError(
        "Could not load record",
        new DatabaseException({ status: 403, message: "forbidden" }),
      ),
      level: "warning",
      title: "DatabaseException: forbidden",
      tags: { error_class: "not-permitted" },
    },
  ] as {
    case: string;
    error: Error;
    loggedLevel?: Sentry.SeverityLevel;
    unhandled?: boolean;
    level: Sentry.SeverityLevel;
    title: string;
    tags: Record<string, string>;
  }[])(
    "should report $case",
    ({ error, loggedLevel, unhandled, level, title: expected, tags }) => {
      const event = processSentryEvent(
        { ...eventFor(error, { unhandled }), level: loggedLevel ?? "error" },
        { originalException: error },
      );

      expect(event.level).toBe(level);
      expect(title(event)).toBe(expected);
      expect(event.tags).toMatchObject(tags);
    },
  );

  it("should cap the events of one issue per session, without silencing other issues", () => {
    const repeated = () => process(new Error("Repeated failure"));
    for (let i = 0; i < MAX_REPEATED_SENTRY_EVENTS; i++) {
      expect(repeated()).not.toBeNull();
    }

    expect(repeated()).toBeNull();
    expect(process(new Error("Another failure"))).not.toBeNull();
  });

  describe("reporting each failure once per page load", () => {
    it("should report an error once when it is logged by a component and then reaches the error handler unhandled", () => {
      const failure = new DatabaseException({
        status: 404,
        message: "missing",
      });

      expect(process(new LoggedError("sync failed", failure))).not.toBeNull();
      expect(process(failure, { unhandled: true })).toBeNull();
    });

    it("should report the same error object only once", () => {
      const failure = new Error("Missing document Child:1");

      expect(process(failure)).not.toBeNull();
      expect(process(failure)).toBeNull();
    });

    it("should report the first failure of a broken local database, as an incident, and none of its follow-ups", () => {
      // AAM-DIGITAL-7CN, then 7CR, 77R, 5WD, 7CP, 7CQ in the same page load
      const first = process(
        browserError(
          "Error",
          'Incorrect adapter: you should specify the "idb" adapter to open this DB',
        ),
        { unhandled: true },
      );
      const followUps = [
        new LoggedError(
          "Failed to load permission rules",
          new DatabaseException(brokenIndexedDb(), "Config:Permissions"),
        ),
        new NamedError(
          "ConfigLoadError",
          "Failed to load configuration from the database.",
          { cause: new DatabaseException(brokenIndexedDb()) },
        ),
        browserError(
          "InvalidStateError",
          "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.",
        ),
        browserError(
          "NotFoundError",
          "Failed to execute 'objectStore' on 'IDBTransaction': The specified object store was not found.",
        ),
        new LoggedError("sync failed", brokenIndexedDb()),
      ].map((error) => process(error));

      expect(first.tags).toMatchObject({ incident: "local-db" });
      expect(followUps).toEqual(followUps.map(() => null));
      // other failures are still reported
      expect(process(new Error("Another failure"))).not.toBeNull();
    });

    it("should count multi-tab corruption as a local database failure, but not a programming error in a database call", () => {
      // AAM-DIGITAL-74Z and 7CV, one page load
      const rangeError = browserError(
        "RangeError",
        "Failed to execute 'put' on 'IDBObjectStore': Maximum call stack size exceeded",
      );
      const corruption = new LoggedError(
        "sync failed: likely multi-tab IndexedDB corruption",
        Object.assign(new Error("Database encountered an unknown error"), {
          name: "unknown_error",
          status: 500,
          reason: "transaction was aborted",
        }),
      );

      expect(process(rangeError, { unhandled: true }).tags?.incident).toBe(
        undefined,
      );
      expect(process(corruption).tags).toMatchObject({ incident: "local-db" });
      expect(process(corruption)).toBeNull();
    });

    it("should report the network issue once per page load", () => {
      // AAM-DIGITAL-77E: all pending requests fail at the same moment
      const network = () =>
        process(new LoggedError("Could not load notes", failedFetch()));

      expect(network().fingerprint).toEqual(["network-error"]);
      expect(network()).toBeNull();
    });
  });
});
