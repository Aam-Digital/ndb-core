import {
  ConnectivityError,
  LocalStorageError,
  NotPermittedError,
  ServerError,
  SessionExpiredError,
  WriteConflictError,
} from "../../logging/error-classification";
import { DatabaseException, toTypedDatabaseError } from "./database-exception";

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
      // PouchDB's `createError()` copies the own properties onto a new PouchError
      { name: "SessionExpiredError", status: 401, message: "Session expired" },
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

describe("DatabaseException", () => {
  it("should keep the typed error as its cause and the raw error's properties for callers", () => {
    const raw = serverResponse(409, {
      error: "conflict",
      reason: "Document update conflict",
    });

    const exception = new DatabaseException(raw, "Child:1");

    expect(exception.cause).toBeInstanceOf(WriteConflictError);
    expect(exception).toMatchObject({
      name: "DatabaseException",
      message: "Document update conflict",
      status: 409,
      reason: "Document update conflict",
      entityId: "Child:1",
    });
  });

  it("should keep the typed error as its cause when the wrapped copy has a cause of its own", () => {
    const loginFailure = new Error("Login server not reachable");
    const copy = pouchCopyOf(
      new SessionExpiredError("Session could not be renewed", {
        status: 401,
        cause: loginFailure,
      }),
    );

    const exception = new DatabaseException(copy);

    expect(exception.cause).toBeInstanceOf(SessionExpiredError);
    expect((exception.cause as Error).cause).toBe(copy);
  });
});
