import {
  classifyError,
  ErrorClassification,
  isConnectivityError,
  isNotPermittedError,
} from "./error-classification";
import { DatabaseException } from "../database/pouchdb/database-exception";

/** The error PouchDB's http adapter builds from CouchDB's 401 response. */
const couchDbUnauthorized = (reason: string) => ({
  status: 401,
  name: "unauthorized",
  error: "unauthorized",
  reason,
  message: reason,
});

/** keycloak-js hands on the whole `Response` instead of lifting the status out of it. */
const keycloakError = (status: number) =>
  Object.assign(new Error("Server responded with an invalid status."), {
    response: { status },
  });

describe("classification helpers", () => {
  it.each<[string, unknown, ErrorClassification | undefined]>([
    ["nothing", undefined, undefined],
    ["a programming error", new Error("x is not a function"), undefined],
    ["a 404", { status: 404 }, undefined],
    ...[0, 502, 503, 504].map(
      (status): [string, unknown, ErrorClassification] => [
        `status ${status}`,
        { status },
        "connectivity",
      ],
    ),
    ["a gateway status in a Response", keycloakError(503), "connectivity"],
    ["a client error status in a Response", keycloakError(400), undefined],
    [
      "an AbortError",
      new DOMException("aborted", "AbortError"),
      "connectivity",
    ],
    [
      "a TimeoutError",
      new DOMException("timed out", "TimeoutError"),
      "connectivity",
    ],
    ["Chrome's failed fetch", new TypeError("Failed to fetch"), "connectivity"],
    [
      "Firefox's failed fetch",
      new TypeError("NetworkError when attempting to fetch resource"),
      "connectivity",
    ],
    ["Safari's failed fetch", new TypeError("Load failed"), "connectivity"],
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
      { ...couchDbUnauthorized("exp not in future"), status: 400 },
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
    ["a 403", { status: 403, message: "Forbidden" }, "not-permitted"],
    [
      "a 401 without reason",
      { status: 401, message: "Unauthorized" },
      undefined,
    ],
    [
      "a 401 for an invalid token",
      couchDbUnauthorized("Token signature is not valid"),
      undefined,
    ],
  ])("classifies %s", (_, error, expected) => {
    expect(classifyError(error)).toBe(expected);
    expect(isConnectivityError(error)).toBe(expected === "connectivity");
    expect(isNotPermittedError(error)).toBe(expected === "not-permitted");
  });
});
