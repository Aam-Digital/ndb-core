import { isConnectivityError } from "./is-connectivity-error";
import { DatabaseException } from "../core/database/pouchdb/pouch-database";
import { ConnectivityError } from "#src/app/utils/backend-errors";
import { SyncFailedError } from "../core/database/pouchdb/synced-pouch-database";

describe("isConnectivityError", () => {
  it("returns false for nullish or unrelated errors", () => {
    expect(isConnectivityError(undefined)).toBe(false);
    expect(isConnectivityError(null)).toBe(false);
    expect(isConnectivityError(new Error("x is not a function"))).toBe(false);
    expect(isConnectivityError({ status: 404 })).toBe(false);
  });

  it.each([
    ["a failed fetch", new TypeError("Failed to fetch")],
    ["an abort", new DOMException("aborted", "AbortError")],
    ["a gateway status", { status: 504 }],
  ])(
    "does not judge %s that passed no boundary by its name, status or wording",
    (_, error) => {
      // converted into a ConnectivityError where it enters the app (database
      // layer, HTTP interceptor, KeycloakAuthService), see their specs
      expect(isConnectivityError(error)).toBe(false);
    },
  );

  it("classifies a DatabaseException that wraps an AbortError (by the wrapped name)", () => {
    // the abort's name would otherwise be clobbered to "DatabaseException"
    const wrapped = new DatabaseException(
      new DOMException("The operation was aborted.", "AbortError"),
      "Config:CONFIG_ENTITY",
    );

    expect(wrapped.name).toBe("DatabaseException");
    expect(isConnectivityError(wrapped)).toBe(true);
  });

  it("detects the failed fetch of the remote database, also wrapped by another error", () => {
    // what the remote database's fetch throws, wrapped by PouchDatabase
    const failedFetch = new DatabaseException(
      new ConnectivityError("Failed to fetch from DB", {
        cause: new TypeError("Failed to fetch"),
      }),
    );

    expect(isConnectivityError(failedFetch)).toBe(true);
    expect(isConnectivityError(new SyncFailedError(failedFetch))).toBe(true);
  });
});
