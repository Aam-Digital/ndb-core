import type * as Sentry from "@sentry/angular";
import { LoggedError, NamedError } from "./reported-errors";
import { processSentryEvent } from "./sentry-event-processing";
import { resetReportedEvents } from "./report-once";
import { normalizeErrorValue } from "./sentry-grouping";
import { ServerError } from "#src/app/utils/backend-errors";
import { DatabaseException } from "../database/pouchdb/database-exception";
import { RegistryLookupError } from "#src/app/core/config/registry/dynamic-registry";
import { HttpErrorResponse } from "@angular/common/http";
import { toTypedHttpError } from "#src/app/utils/typed-http-error.interceptor";
import {
  brokenIndexedDb,
  processError,
  setUpPageLoad,
  title,
  withStack,
} from "./logging-test-utils";

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
  setUpPageLoad();

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
        fingerprint: ["ServerError", "server error response from db", "500"],
        title: "ServerError: Server error response from DB (HTTP 500)",
        reportedBy: "ConfigLoadError: Failed to load configuration.",
      },
      {
        case: "a classified database failure, by the typed error rather than the raw error it was converted from",
        error: new LoggedError(
          "Could not load school",
          new DatabaseException(brokenIndexedDb()),
        ),
        fingerprint: ["LocalStorageError", "unknown"],
        title: "LocalStorageError: unknown",
        reportedBy: "Error: Could not load school",
      },
      {
        case: "a DatabaseException passing on a typed error, like that error",
        error: new DatabaseException(
          new ServerError("Server error response from DB", { status: 500 }),
        ),
        fingerprint: ["ServerError", "server error response from db", "500"],
        title: "ServerError: Server error response from DB (HTTP 500)",
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
        const event = processError(error);

        expect(event.fingerprint).toEqual(fingerprint);
        expect(title(event)).toBe(expected);
        expect(event.tags?.reported_by).toBe(reportedBy);
      },
    );

    it.each([
      [
        "/api/v1/skill/user-profile?fullName=Jane+Doe",
        "/api/v1/skill/user-profile?fullName=John+Roe",
        "/api/v1/skill/user-profile",
        "/api/v1/skill/user-profile",
      ],
      [
        "/db/app/Child%3A1?rev=1-abc",
        "/db/app/Child%3A2",
        "/db/app/<id>",
        "/db/app/<id>",
      ],
      [
        "/api/v1/skill/user-profile",
        "/api/v1/reporting/report-calculation",
        "/api/v1/skill/user-profile",
        "/api/v1/reporting/report-calculation",
      ],
    ])(
      "should group server errors of %s and %s by their endpoint",
      (urlA, urlB, pathA, pathB) => {
        const [eventA, eventB] = [urlA, urlB].map((url) =>
          processError(
            new LoggedError(
              "Could not load",
              toTypedHttpError(new HttpErrorResponse({ status: 500, url }), {
                method: "GET",
                url,
              }) as Error,
            ),
            withStack,
          ),
        );

        expect(eventA.fingerprint.join() === eventB.fingerprint.join()).toBe(
          pathA === pathB,
        );
        for (const [event, path] of [
          [eventA, pathA],
          [eventB, pathB],
        ] as const) {
          expect(title(event)).toMatch(new RegExp(`\\(HTTP 500 ${path}\\)$`));
          expect(`${title(event)} ${event.fingerprint}`).not.toMatch(
            /\?|Jane|John|Child|rev/,
          );
        }
      },
    );

    it("should group one classified root cause logged by different components into one issue, telling the components apart by tag", () => {
      // like AAM-DIGITAL-7CQ, 7CR, 77R: one broken local database, one issue
      const bySync = processError(
        new LoggedError(
          "sync failed",
          new DatabaseException(brokenIndexedDb()),
        ),
      );
      resetReportedEvents(); // the next page load
      const byPermissions = processError(
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
          processError(new LoggedError(message, rootCause()), {
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
        expect(processError(error, withStack).fingerprint).toEqual(fingerprint);
      },
    );

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
});
