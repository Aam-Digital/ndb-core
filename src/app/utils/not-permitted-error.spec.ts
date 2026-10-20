import { DatabaseException } from "../core/database/pouchdb/database-exception";
import { isNotPermittedError } from "./not-permitted-error";

describe("isNotPermittedError", () => {
  it("should detect the permission backend refusing a record (wrapped in a DatabaseException)", () => {
    // the body of the replication backend's `UnauthorizedException('unauthorized', 'User is not permitted')`
    const err = new DatabaseException(
      { status: 401, message: "unauthorized", error: "User is not permitted" },
      "School:1",
    );

    expect(isNotPermittedError(err)).toBe(true);
  });

  it("should treat any 403 as not permitted", () => {
    expect(isNotPermittedError({ status: 403, message: "Forbidden" })).toBe(
      true,
    );
  });

  it("should not match an expired session", () => {
    expect(
      isNotPermittedError({
        status: 401,
        error: "unauthorized",
        reason: "exp not in future",
        message: "exp not in future",
      }),
    ).toBe(false);
  });

  it("should not match other 401 errors or other statuses", () => {
    expect(isNotPermittedError({ status: 401, message: "Unauthorized" })).toBe(
      false,
    );
    expect(
      isNotPermittedError({
        status: 401,
        error: "unauthorized",
        reason: "invalid signature",
      }),
    ).toBe(false);
    expect(isNotPermittedError({ status: 404 })).toBe(false);
    expect(isNotPermittedError(undefined)).toBe(false);
  });
});
