import { DatabaseException } from "../core/database/pouchdb/database-exception";
import { isNotPermittedError } from "./not-permitted-error";
import { HttpErrorResponse } from "@angular/common/http";
import { toTypedHttpError } from "../core/logging/typed-http-error.interceptor";
import { LoggedError } from "../core/logging/reported-errors";

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
