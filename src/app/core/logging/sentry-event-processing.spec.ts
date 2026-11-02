import type * as Sentry from "@sentry/angular";
import { LoggedError, NamedError } from "./reported-errors";
import { processSentryEvent } from "./sentry-event-processing";
import { ServerError } from "./error-classification";
import { DatabaseException } from "../database/pouchdb/database-exception";
import { RegistryLookupError } from "#src/app/core/config/registry/dynamic-registry";
import {
  eventFor,
  failedFetch,
  processError,
  setUpPageLoad,
  title,
} from "./logging-test-utils";

describe("processSentryEvent", () => {
  setUpPageLoad();

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
        case: "a record the permission rules exclude, reported without a message of its own",
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

      expect(processError(error) === null).toBe(dropped);
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
    expect(processError(error).extra).toMatchObject(extra);
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
});
