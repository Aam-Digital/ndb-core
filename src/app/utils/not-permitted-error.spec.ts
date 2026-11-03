import { DatabaseException } from "../core/database/pouchdb/database-exception";
import { isNotPermittedError } from "./not-permitted-error";
import { HttpErrorResponse } from "@angular/common/http";
import { toTypedHttpError } from "./typed-http-error.interceptor";
import { LoggedError } from "../core/logging/reported-errors";
import { isConnectivityError } from "./connectivity-error";
import { isExpiredSessionError } from "./expired-session-error";
import { ConnectivityError } from "#src/app/utils/backend-errors";
import { NotPermittedError } from "#src/app/core/permissions/not-permitted.error";
import { SessionExpiredError } from "#src/app/core/session/session-expired.error";

describe("isNotPermittedError", () => {
  it("should detect the permission backend refusing a record (wrapped in a DatabaseException)", () => {
    // the body of the replication backend's `UnauthorizedException('unauthorized', 'User is not permitted')`
    const err = new DatabaseException(
      { status: 401, message: "unauthorized", error: "User is not permitted" },
      "School:1",
    );

    expect(isNotPermittedError(err)).toBe(true);
  });

  it.each([
    [
      "of the database",
      new DatabaseException({ status: 403, message: "forbidden" }),
    ],
    [
      "of the API",
      toTypedHttpError(new HttpErrorResponse({ status: 403 }), {
        method: "GET",
        url: "/api/v1/x",
      }),
    ],
    [
      "wrapped by another error",
      new LoggedError(
        "Could not load record",
        new DatabaseException({ status: 403, message: "forbidden" }),
      ),
    ],
  ])("should treat any 403 %s as not permitted", (_, err) => {
    expect(isNotPermittedError(err)).toBe(true);
  });

  it("should not match an expired session", () => {
    expect(
      isNotPermittedError(
        new DatabaseException({
          status: 401,
          error: "unauthorized",
          reason: "exp not in future",
          message: "exp not in future",
        }),
      ),
    ).toBe(false);
  });

  it("should not match other 401 errors or other statuses", () => {
    expect(
      isNotPermittedError(
        new DatabaseException({ status: 401, message: "Unauthorized" }),
      ),
    ).toBe(false);
    expect(
      isNotPermittedError(
        new DatabaseException({
          status: 401,
          error: "unauthorized",
          message: "invalid signature",
        }),
      ),
    ).toBe(false);
    expect(
      isNotPermittedError(
        new DatabaseException({ status: 404, message: "missing" }),
      ),
    ).toBe(false);
    expect(isNotPermittedError(undefined)).toBe(false);
  });
});

describe("the error classification helpers", () => {
  const helpers = {
    isConnectivityError,
    isNotPermittedError,
    isExpiredSessionError,
  };

  it.each<[string, unknown, keyof typeof helpers | undefined]>([
    [
      "a typed error",
      new NotPermittedError("forbidden"),
      "isNotPermittedError",
    ],
    [
      "a typed error wrapped by a logged message",
      new LoggedError("Could not load", new SessionExpiredError("expired")),
      "isExpiredSessionError",
    ],
    [
      "a typed error that lost its class (a copy made by PouchDB)",
      { name: "SessionExpiredError", message: "Session could not be renewed" },
      "isExpiredSessionError",
    ],
    [
      "a DatabaseException converting a raw error",
      new DatabaseException({ status: 403, message: "forbidden" }),
      "isNotPermittedError",
    ],
    [
      "a DatabaseException wrapping a typed error",
      new DatabaseException(new ConnectivityError("Failed to fetch from DB")),
      "isConnectivityError",
    ],
    [
      "an unclassified failure",
      new DatabaseException({ status: 404, message: "missing" }),
      undefined,
    ],
  ])("should agree with the classification for %s", (_, err, matching) => {
    for (const [name, helper] of Object.entries(helpers)) {
      expect(helper(err), name).toBe(name === matching);
    }
  });
});
