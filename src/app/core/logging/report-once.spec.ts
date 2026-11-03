import { LoggedError, NamedError } from "./reported-errors";
import { MAX_REPEATED_SENTRY_EVENTS } from "./report-once";
import { DatabaseException } from "../database/pouchdb/database-exception";
import {
  brokenIndexedDb,
  browserError,
  failedFetch,
  processError,
  setUpPageLoad,
} from "./logging-test-utils";

describe("processSentryEvent", () => {
  setUpPageLoad();

  it("should cap the events of one issue per session, without silencing other issues", () => {
    const repeated = () => processError(new Error("Repeated failure"));
    for (let i = 0; i < MAX_REPEATED_SENTRY_EVENTS; i++) {
      expect(repeated()).not.toBeNull();
    }

    expect(repeated()).toBeNull();
    expect(processError(new Error("Another failure"))).not.toBeNull();
  });

  describe("reporting each failure once per page load", () => {
    it("should report an error once when it is logged by a component and then reaches the error handler unhandled", () => {
      const failure = new DatabaseException({
        status: 404,
        message: "missing",
      });

      expect(
        processError(new LoggedError("sync failed", failure)),
      ).not.toBeNull();
      expect(processError(failure, { unhandled: true })).toBeNull();
    });

    it("should report the same error object only once", () => {
      const failure = new Error("Missing document Child:1");

      expect(processError(failure)).not.toBeNull();
      expect(processError(failure)).toBeNull();
    });

    it("should report the first failure of a broken local database, as an incident, and none of its follow-ups", () => {
      // AAM-DIGITAL-7CN, then 7CR, 77R, 5WD, 7CP, 7CQ in the same page load
      const first = processError(
        browserError(
          "Error",
          'Incorrect adapter: you should specify the "idb" adapter to open this DB',
        ),
        { unhandled: true },
      );
      const followUps = [
        new LoggedError(
          "Failed to load permission rules",
          new DatabaseException(brokenIndexedDb(), "Config:Permissions"),
        ),
        new NamedError(
          "ConfigLoadError",
          "Failed to load configuration from the database.",
          { cause: new DatabaseException(brokenIndexedDb()) },
        ),
        browserError(
          "InvalidStateError",
          "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.",
        ),
        browserError(
          "NotFoundError",
          "Failed to execute 'objectStore' on 'IDBTransaction': The specified object store was not found.",
        ),
        new LoggedError("sync failed", brokenIndexedDb()),
      ].map((error) => processError(error));

      expect(first.tags).toMatchObject({ incident: "local-db" });
      expect(followUps).toEqual(followUps.map(() => null));
      // other failures are still reported
      expect(processError(new Error("Another failure"))).not.toBeNull();
    });

    it("should not count a programming error in a database call as a local database failure", () => {
      // AAM-DIGITAL-74Z
      const rangeError = browserError(
        "RangeError",
        "Failed to execute 'put' on 'IDBObjectStore': Maximum call stack size exceeded",
      );

      expect(processError(rangeError, { unhandled: true }).tags?.incident).toBe(
        undefined,
      );
    });

    it("should report the network issue once per page load", () => {
      // AAM-DIGITAL-77E: all pending requests fail at the same moment
      const network = () => processError(failedFetch(), { unhandled: true });

      expect(network().fingerprint).toEqual(["network-error"]);
      expect(network()).toBeNull();
    });
  });
});
