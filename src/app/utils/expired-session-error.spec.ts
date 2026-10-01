import { DatabaseException } from "../core/database/pouchdb/database-exception";
import { isExpiredSessionError } from "./expired-session-error";

describe("isExpiredSessionError", () => {
  /** The error PouchDB's http adapter builds from CouchDB's 401 response. */
  function couchDbUnauthorized(reason: string) {
    return {
      status: 401,
      name: "unauthorized",
      error: "unauthorized",
      reason,
      message: reason,
    };
  }

  it("should detect an expired token wrapped in a DatabaseException", () => {
    const err = new DatabaseException(
      couchDbUnauthorized("exp not in future"),
      "Config:CONFIG_ENTITY",
    );

    expect(isExpiredSessionError(err)).toBe(true);
  });

  it("should detect an expired token whose message was replaced", () => {
    // e.g. pouchdb-find reports the same response as "Database error"
    const err = new DatabaseException({
      ...couchDbUnauthorized("exp not in future"),
      message: "Database error",
    });

    expect(isExpiredSessionError(err)).toBe(true);
  });

  it("should not match other reasons for a 401", () => {
    const err = new DatabaseException(
      couchDbUnauthorized("Token signature is not valid"),
    );

    expect(isExpiredSessionError(err)).toBe(false);
  });

  it("should not match the same reason with another status", () => {
    const err = { ...couchDbUnauthorized("exp not in future"), status: 400 };

    expect(isExpiredSessionError(err)).toBe(false);
  });

  it("should not match missing or unrelated errors", () => {
    expect(isExpiredSessionError(undefined)).toBe(false);
    expect(isExpiredSessionError(new Error("Failed to fetch"))).toBe(false);
  });
});
