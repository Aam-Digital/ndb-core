import { isConnectivityError } from "./connectivity-error";
import { DatabaseException } from "../core/database/pouchdb/pouch-database";

describe("isConnectivityError", () => {
  it("returns false for nullish or unrelated errors", () => {
    expect(isConnectivityError(undefined)).toBe(false);
    expect(isConnectivityError(null)).toBe(false);
    expect(isConnectivityError(new Error("x is not a function"))).toBe(false);
    expect(isConnectivityError({ status: 404 })).toBe(false);
  });

  it("detects raw AbortError / TimeoutError by name", () => {
    expect(isConnectivityError(new DOMException("aborted", "AbortError"))).toBe(
      true,
    );
    expect(
      isConnectivityError(new DOMException("timed out", "TimeoutError")),
    ).toBe(true);
  });

  it("detects transient gateway/offline status codes", () => {
    for (const status of [0, 502, 503, 504]) {
      expect(isConnectivityError({ status })).toBe(true);
    }
  });

  it("detects browser fetch failures by message", () => {
    expect(isConnectivityError(new TypeError("Failed to fetch"))).toBe(true);
    expect(
      isConnectivityError(
        new TypeError("NetworkError when attempting to fetch resource"),
      ),
    ).toBe(true);
    expect(isConnectivityError(new TypeError("Load failed"))).toBe(true);
  });

  it("classifies a DatabaseException that wraps an AbortError (via originalName)", () => {
    // the abort's name would otherwise be clobbered to "DatabaseException"
    const wrapped = new DatabaseException(
      new DOMException("The operation was aborted.", "AbortError"),
      "Config:CONFIG_ENTITY",
    );

    expect(wrapped.name).toBe("DatabaseException");
    expect(isConnectivityError(wrapped)).toBe(true);
  });

  it("classifies a DatabaseException whose message is a network failure", () => {
    const wrapped = new DatabaseException({
      message: "Failed to fetch from DB",
    });

    expect(isConnectivityError(wrapped)).toBe(true);
  });
});
