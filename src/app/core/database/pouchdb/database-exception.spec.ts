import { ConnectivityError, ServerError } from "#src/app/utils/backend-errors";
import {
  LocalStorageError,
  WriteConflictError,
} from "#src/app/core/database/pouchdb/database-errors";
import { NotPermittedError } from "#src/app/core/permissions/not-permitted.error";
import { SessionExpiredError } from "#src/app/core/session/session-expired.error";
import { databaseError, toTypedDatabaseError } from "./database-exception";

/** A copy of an error like PouchDB's `createError()` makes: all own properties, without the class. */
function pouchCopyOf(error: Error): Error {
  const copy = Object.create(Error.prototype);
  for (const name of Object.getOwnPropertyNames(error)) {
    copy[name] = error[name];
  }
  return copy;
}

/** The error PouchDB's http adapter builds from an error response of the server. */
function serverResponse(status: number, body: Record<string, string>) {
  return { status, name: body.error, message: body.reason, ...body };
}

describe("toTypedDatabaseError", () => {
  it.each([
    [
      "an expired session",
      serverResponse(401, {
        error: "unauthorized",
        reason: "exp not in future",
      }),
      SessionExpiredError,
    ],
    [
      "a 401 the permission backend calls not permitted",
      // the body of the replication backend's `UnauthorizedException('unauthorized', 'User is not permitted')`
      { status: 401, message: "unauthorized", error: "User is not permitted" },
      NotPermittedError,
    ],
    [
      "a 403",
      serverResponse(403, { error: "forbidden", reason: "forbidden" }),
      NotPermittedError,
    ],
    [
      "a rejected write",
      serverResponse(409, {
        error: "conflict",
        reason: "Document update conflict",
      }),
      WriteConflictError,
    ],
    [
      "a broken IndexedDB, by PouchDB's name for it",
      { status: 500, name: "indexed_db_went_bad", message: "unknown" },
      LocalStorageError,
    ],
    [
      "a broken IndexedDB, by the browser's wording",
      new DOMException(
        "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.",
        "InvalidStateError",
      ),
      LocalStorageError,
    ],
    [
      "a request aborted while reading the response",
      new DOMException("The operation was aborted.", "AbortError"),
      ConnectivityError,
    ],
    [
      "a connection dropped while reading the response",
      new TypeError("NetworkError when attempting to fetch resource."),
      ConnectivityError,
    ],
    [
      "a typed error that the replication copied, losing its class",
      pouchCopyOf(new SessionExpiredError("Session expired", { status: 401 })),
      SessionExpiredError,
    ],
    [
      "another 401 (e.g. a token with an invalid signature)",
      serverResponse(401, { error: "unauthorized", reason: "Unknown kid" }),
      undefined,
    ],
    [
      "a missing document",
      serverResponse(404, { error: "not_found", reason: "missing" }),
      undefined,
    ],
  ])("should convert %s", (_, raw, expectedType) => {
    const converted = toTypedDatabaseError(raw);

    if (expectedType) {
      expect(converted).toBeInstanceOf(expectedType);
      expect(converted).toMatchObject({
        status: (raw as { status?: number }).status,
        cause: raw,
      });
    } else {
      expect(converted).toBe(raw);
    }
  });

  it("should keep an error of ours as it is", () => {
    const serverError = new ServerError("Server error response from DB", {
      status: 500,
    });

    expect(toTypedDatabaseError(serverError)).toBe(serverError);
  });
});

describe("databaseError", () => {
  it("should be the typed error of a classified failure, with the document as extra data", () => {
    const raw = serverResponse(409, {
      error: "conflict",
      reason: "Document update conflict",
    });

    const error = databaseError(raw, "Child:1");

    expect(error).toBeInstanceOf(WriteConflictError);
    expect(error).toMatchObject({
      status: 409,
      cause: raw,
      details: { entityId: "Child:1" },
    });
  });

  it("should keep the properties of any other error for callers", () => {
    const raw = serverResponse(404, { error: "not_found", reason: "missing" });

    expect(databaseError(raw, "Child:1")).toMatchObject({
      name: "DatabaseException",
      message: "missing",
      status: 404,
      reason: "missing",
      entityId: "Child:1",
    });
  });

  it("should re-create a typed error that the replication copied, keeping the copy as its cause", () => {
    const loginFailure = new Error("Login server not reachable");
    const copy = pouchCopyOf(
      new SessionExpiredError("Session could not be renewed", {
        status: 401,
        cause: loginFailure,
      }),
    );

    const error = databaseError(copy);

    expect(error).toBeInstanceOf(SessionExpiredError);
    expect(error.cause).toBe(copy);
  });
});
