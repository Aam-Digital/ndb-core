import {
  classifyError,
  classifyErrorChain,
  ErrorClassification,
  isConnectivityError,
  isNotPermittedError,
} from "./error-classification";
import { ConnectivityError, ServerError } from "#src/app/utils/backend-errors";
import { NotPermittedError } from "#src/app/core/permissions/not-permitted.error";
import { SessionExpiredError } from "#src/app/core/session/session-expired.error";
import { classifyReportedError } from "./uncaught-error-classification";
import { DatabaseException } from "../database/pouchdb/database-exception";
import { SyncFailedError } from "../database/pouchdb/synced-pouch-database";
import { HttpErrorResponse } from "@angular/common/http";
import { toTypedHttpError } from "#src/app/utils/typed-http-error.interceptor";
import { LoggedError, NamedError } from "./reported-errors";
import { browserError } from "./logging-test-utils";

/** The error PouchDB's http adapter builds from CouchDB's 401 response. */
const couchDbUnauthorized = (reason: string) => ({
  status: 401,
  name: "unauthorized",
  error: "unauthorized",
  reason,
  message: reason,
});

describe("classification helpers", () => {
  it.each<[string, unknown, ErrorClassification | undefined]>([
    ["nothing", undefined, undefined],
    ["null", null, undefined],
    ["a programming error", new Error("x is not a function"), undefined],
    ["a 404", { status: 404 }, undefined],
    // foreign errors are converted into typed errors where they enter the app
    // (database layer, HTTP interceptor, KeycloakAuthService), see their specs
    [
      "a failed fetch that passed no boundary",
      new TypeError("Failed to fetch"),
      undefined,
    ],
    [
      "an abort that passed no boundary",
      new DOMException("aborted", "AbortError"),
      undefined,
    ],
    ["a gateway status that passed no boundary", { status: 504 }, undefined],
    [
      "a typed error that lost its class (a copy made by PouchDB)",
      { name: "SessionExpiredError", message: "Session could not be renewed" },
      "session-expired",
    ],
    ["a typed error", new NotPermittedError("forbidden"), "not-permitted"],
    [
      "a typed error wrapped by a logged message",
      new LoggedError("Could not load", new SessionExpiredError("expired")),
      "session-expired",
    ],
    [
      "a DatabaseException wrapping a typed error",
      new DatabaseException(new ConnectivityError("Failed to fetch from DB")),
      "connectivity",
    ],
    [
      "a connectivity failure wrapped by another error",
      new SyncFailedError(
        new DatabaseException(new ConnectivityError("Failed to fetch from DB")),
      ),
      "connectivity",
    ],
    [
      // the abort's name is replaced by "DatabaseException"
      "a DatabaseException wrapping an AbortError",
      new DatabaseException(
        new DOMException("The operation was aborted.", "AbortError"),
        "Config:CONFIG_ENTITY",
      ),
      "connectivity",
    ],
    [
      "a DatabaseException whose message is a network failure",
      new DatabaseException({ message: "Failed to fetch from DB" }),
      "connectivity",
    ],
    [
      "an expired token wrapped in a DatabaseException",
      new DatabaseException(
        couchDbUnauthorized("exp not in future"),
        "Config:CONFIG_ENTITY",
      ),
      "session-expired",
    ],
    [
      // e.g. pouchdb-find reports the same response as "Database error"
      "an expired token whose message was replaced",
      new DatabaseException({
        ...couchDbUnauthorized("exp not in future"),
        message: "Database error",
      }),
      "session-expired",
    ],
    [
      "the expired token reason with another status",
      new DatabaseException({
        ...couchDbUnauthorized("exp not in future"),
        status: 400,
      }),
      undefined,
    ],
    [
      // the body of the replication backend's `UnauthorizedException('unauthorized', 'User is not permitted')`
      "a 401 the permission backend calls not permitted",
      new DatabaseException(
        {
          status: 401,
          message: "unauthorized",
          error: "User is not permitted",
        },
        "School:1",
      ),
      "not-permitted",
    ],
    [
      "a 403 of the database",
      new DatabaseException({ status: 403, message: "forbidden" }),
      "not-permitted",
    ],
    [
      "a 403 of the API",
      toTypedHttpError(new HttpErrorResponse({ status: 403 }), {
        method: "GET",
        url: "/api/v1/x",
      }),
      "not-permitted",
    ],
    [
      "a 403 wrapped by another error",
      new LoggedError(
        "Could not load record",
        new DatabaseException({ status: 403, message: "forbidden" }),
      ),
      "not-permitted",
    ],
    [
      "a 401 without reason",
      new DatabaseException({ status: 401, message: "Unauthorized" }),
      undefined,
    ],
    [
      "a 401 for an invalid token",
      new DatabaseException(
        couchDbUnauthorized("Token signature is not valid"),
      ),
      undefined,
    ],
    [
      "an unclassified database failure",
      new DatabaseException({ status: 404, message: "missing" }),
      undefined,
    ],
  ])("classifies %s", (_, error, expected) => {
    expect(classifyErrorChain(error)).toBe(expected);
    expect(isConnectivityError(error)).toBe(expected === "connectivity");
    expect(isNotPermittedError(error)).toBe(expected === "not-permitted");
  });
});

describe("classifyError", () => {
  it.each([
    [
      "a typed error, by its type rather than its wording",
      new ServerError("Failed to fetch from DB", { status: 500 }),
      "server-error",
    ],
    ["a typed error", new NotPermittedError("forbidden"), "not-permitted"],
    [
      "a DatabaseException, by the typed error it wraps",
      new DatabaseException({ status: 409, message: "conflict" }),
      "write-conflict",
    ],
    [
      "a typed error that lost its class, by its name",
      { name: "SessionExpiredError", message: "Session could not be renewed" },
      "session-expired",
    ],
    [
      "a failed response of our backend not by its status, as the HTTP interceptor converts it",
      new HttpErrorResponse({ status: 403 }),
      undefined,
    ],
    [
      "a foreign error never by its wording, as the boundaries convert it",
      new TypeError("Failed to fetch"),
      undefined,
    ],
  ])("should classify %s", (_, error, expected) => {
    expect(classifyError(error)).toBe(expected);
  });
});

describe("classifyReportedError", () => {
  it.each([
    [
      "a request of another service that never got a response",
      new HttpErrorResponse({ status: 0 }),
      "connectivity",
    ],
    [
      "a gateway status of another service",
      new HttpErrorResponse({ status: 503 }),
      "connectivity",
    ],
    [
      "an HttpErrorResponse without response logged as message",
      "Http failure response for /nominatim/search: 0 Unknown Error",
      "connectivity",
    ],
    [
      "a failed fetch (Chrome)",
      new TypeError("Failed to fetch"),
      "connectivity",
    ],
    [
      "a failed fetch (Firefox)",
      new TypeError("NetworkError when attempting to fetch resource."),
      "connectivity",
    ],
    ["a failed fetch (Safari)", new TypeError("Load failed"), "connectivity"],
    [
      "a failed chunk load (Chrome)",
      new TypeError(
        "Failed to fetch dynamically imported module: https://example.org/chunk-A1B2.js",
      ),
      "connectivity",
    ],
    [
      "a failed chunk load (Safari)",
      new TypeError("Importing a module script failed."),
      "connectivity",
    ],
    [
      "an IndexedDB error raised in PouchDB's callbacks",
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
      "a typed error, by its type",
      new ServerError("Failed to fetch from DB", { status: 500 }),
      "server-error",
    ],
    [
      "a logged message, never by its wording",
      new LoggedError("Failed to fetch notifications"),
      undefined,
    ],
    [
      "a named error of ours, never by its wording",
      new NamedError("AppBootstrapError", "Failed to fetch config"),
      undefined,
    ],
  ])("should classify %s", (_, error, expected) => {
    expect(classifyReportedError(error)).toBe(expected);
  });
});
