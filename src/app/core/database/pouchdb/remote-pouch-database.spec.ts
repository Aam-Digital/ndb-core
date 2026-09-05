import type { Mock } from "vitest";
import { DatabaseException, PouchDatabase } from "./pouch-database";
import PouchDB from "pouchdb-browser";
import { HttpStatusCode } from "@angular/common/http";
import { RemotePouchDatabase } from "./remote-pouch-database";
import { Logging } from "../../logging/logging.service";
import { SyncStateSubject } from "app/core/session/session-type";
import { environment } from "environments/environment";

describe("RemotePouchDatabase tests", () => {
  let database: PouchDatabase;

  let mockAuthService: any;
  let syncStateSubject: SyncStateSubject;

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    mockAuthService = {
      login: vi.fn(),
      addAuthHeader: vi.fn(),
    };
    mockAuthService.addAuthHeader.mockImplementation(() => {});
    // Prevent real HTTP requests from PouchDB during tests
    vi.spyOn(PouchDB, "fetch").mockReturnValue(
      Promise.resolve(new Response("{}", { status: HttpStatusCode.Ok })),
    );
    database = new RemotePouchDatabase(
      "unit-test-db",
      mockAuthService,
      syncStateSubject,
    );
  });

  afterEach(() => database.destroy());

  it("should try auto-login if fetch fails and fetch again", async () => {
    database.init("");

    mockAuthService.login.mockResolvedValue(undefined);
    // providing "valid" token on second call
    let calls = 0;
    mockAuthService.addAuthHeader.mockImplementation(
      (headers: Record<string, string>) => {
        headers.Authorization = calls % 2 === 1 ? "valid" : "invalid";
      },
    );
    (PouchDB.fetch as Mock).mockImplementation(async (url, opts) => {
      calls++;
      if (opts.headers["Authorization"] === "valid") {
        return new Response('{ "_id": "foo" }', { status: HttpStatusCode.Ok });
      } else {
        return {
          status: HttpStatusCode.Unauthorized,
          ok: false,
        } as Response;
      }
    });

    await (database as any).defaultFetch(
      `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
      { headers: {} },
    );

    expect(PouchDB.fetch).toHaveBeenCalledTimes(2);
    expect(mockAuthService.login).toHaveBeenCalled();
    expect(mockAuthService.addAuthHeader).toHaveBeenCalledTimes(2);
  });

  it("should set ngsw-bypass header on fetch requests", async () => {
    database.init("");

    const headers = new Headers();
    await (database as any).defaultFetch(
      `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
      { headers },
    );

    expect(headers.get("ngsw-bypass")).toBe("true");
  });

  const READ_URL = `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`;

  describe("withReadRetry (operation-level retry for idempotent reads)", () => {
    it("should retry a transient (connectivity) failure then resolve", async () => {
      (database as any).TRANSIENT_ERROR_DELAY_MS = 0;

      let calls = 0;
      const operation = vi.fn(async () => {
        calls++;
        if (calls < 3) {
          throw new TypeError("Failed to fetch");
        }
        return "ok";
      });

      const result = await (database as any).withReadRetry(operation);

      // 1 initial + 2 retries
      expect(calls).toBe(3);
      expect(result).toBe("ok");
    });

    it("should throw after exhausting retries on a persistent transient error", async () => {
      (database as any).TRANSIENT_ERROR_DELAY_MS = 0;

      let calls = 0;
      const operation = vi.fn(async () => {
        calls++;
        throw new DOMException("The operation was aborted.", "AbortError");
      });

      await expect((database as any).withReadRetry(operation)).rejects.toThrow(
        "operation was aborted",
      );
      // 1 initial + 2 retries = 3 total
      expect(calls).toBe(3);
    });

    it("should not retry non-connectivity errors (e.g. a code bug or 404)", async () => {
      let calls = 0;
      const operation = vi.fn(async () => {
        calls++;
        throw new Error("x is not a function");
      });

      await expect((database as any).withReadRetry(operation)).rejects.toThrow(
        "x is not a function",
      );
      expect(calls).toBe(1);
    });
  });

  it("should retry a transient read at the operation level via get() and recover", async () => {
    // Reproduces AAM-DIGITAL-73M: an abort surfacing during the read (e.g.
    // response-body streaming on a stale connection) is retried transparently.
    (database as any).TRANSIENT_ERROR_DELAY_MS = 0;
    database.init("");
    const pouchDB = (database as any).pouchDB;

    let calls = 0;
    vi.spyOn(pouchDB, "get").mockImplementation(async () => {
      calls++;
      if (calls < 2) {
        throw new DOMException("The operation was aborted.", "AbortError");
      }
      return { _id: "Entity:ABC" };
    });

    const result = await database.get("Entity:ABC");

    expect(calls).toBe(2);
    expect(result._id).toBe("Entity:ABC");
  });

  it("should surface a persistent transient read failure as a DatabaseException after exhausting retries", async () => {
    (database as any).TRANSIENT_ERROR_DELAY_MS = 0;
    database.init("");
    const pouchDB = (database as any).pouchDB;

    let calls = 0;
    vi.spyOn(pouchDB, "get").mockImplementation(async () => {
      calls++;
      throw new DOMException("The operation was aborted.", "AbortError");
    });

    await expect(database.get("Entity:ABC")).rejects.toThrow(DatabaseException);
    // 1 initial + 2 retries = 3 total
    expect(calls).toBe(3);
  });

  it("fetchWithTimeout attaches an abort signal to reads but no longer retries them", async () => {
    // retry now lives at the operation level (withReadRetry), not the fetch layer
    let calls = 0;
    let capturedOpts: any;
    (PouchDB.fetch as Mock).mockImplementation(async (_url, opts) => {
      calls++;
      capturedOpts = opts;
      throw new TypeError("Failed to fetch");
    });

    await expect(
      (database as any).fetchWithTimeout(READ_URL, {
        method: "GET",
        headers: new Headers(),
      }),
    ).rejects.toThrow(TypeError);

    // read gets the abort timeout signal, but only a single attempt
    expect(capturedOpts?.signal).toBeInstanceOf(AbortSignal);
    expect(calls).toBe(1);
  });

  it("should run writes exactly once with no abort timeout signal", async () => {
    // a tiny timeout would abort almost immediately if it were applied to writes
    (database as any).FETCH_TIMEOUT_MS = 0;

    let calls = 0;
    let capturedOpts: any;
    (PouchDB.fetch as Mock).mockImplementation(async (_url, opts) => {
      calls++;
      capturedOpts = opts;
      return new Response("{}", { status: HttpStatusCode.Ok });
    });

    const result = await (database as any).fetchWithTimeout(READ_URL, {
      method: "PUT",
      headers: new Headers(),
    });

    expect(result.status).toBe(HttpStatusCode.Ok);
    // no AbortController signal is attached to writes, so a slow write is not aborted
    expect(capturedOpts?.signal).toBeUndefined();
    expect(calls).toBe(1);
  });

  it("should use periodic polling for changes feed instead of live long-polling", async () => {
    vi.useFakeTimers();
    try {
      database.init("");

      const mockChangesResult = {
        results: [
          { doc: { _id: "Entity:1", name: "Test Doc 1" }, seq: 1 },
          { doc: { _id: "Entity:2", name: "Test Doc 2" }, seq: 2 },
        ],
        last_seq: 2,
      };

      const pouchDB = (database as any).pouchDB;
      vi.spyOn(pouchDB, "changes").mockReturnValue(
        Promise.resolve(mockChangesResult),
      );

      const receivedDocs: any[] = [];
      const subscription = database.changes().subscribe((doc) => {
        receivedDocs.push(doc);
      });

      // Should not call changes immediately (waits for interval)
      expect(pouchDB.changes).not.toHaveBeenCalled();

      // Advance time by the first polling cycle.
      await vi.advanceTimersByTimeAsync(0);

      // Now changes should have been polled
      expect(pouchDB.changes).toHaveBeenCalledWith({
        since: "now",
        include_docs: true,
      });
      expect(receivedDocs.length).toBe(2);
      expect(receivedDocs[0]._id).toBe("Entity:1");
      expect(receivedDocs[1]._id).toBe("Entity:2");

      // Advance time for second poll
      (pouchDB.changes as Mock).mockClear();
      mockChangesResult.results = [
        { doc: { _id: "Entity:3", name: "Test Doc 3" }, seq: 3 },
      ];
      mockChangesResult.last_seq = 3;

      await vi.advanceTimersByTimeAsync(10000);

      // Should poll again with last_seq from previous result
      expect(pouchDB.changes).toHaveBeenCalledWith({
        since: 2,
        include_docs: true,
      });
      expect(receivedDocs.length).toBe(3);
      expect(receivedDocs[2]._id).toBe("Entity:3");

      subscription.unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show alert when a fetch fails", async () => {
    const mockAlertService = { addWarning: vi.fn() };
    (database as any).alertService = mockAlertService;
    (database as any).FETCH_TIMEOUT_MS = 60000;

    (PouchDB.fetch as Mock).mockImplementation(async () => {
      throw new TypeError("Failed to fetch");
    });

    // defaultFetch catches the error and shows alert
    await expect(
      (database as any).defaultFetch(
        `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
        { headers: {} },
      ),
    ).rejects.toThrow();

    expect(mockAlertService.addWarning).toHaveBeenCalledTimes(1);
    expect(mockAlertService.addWarning).toHaveBeenCalledWith(
      expect.stringContaining("connection issues"),
    );
  });

  it("should throttle connection issue alerts", async () => {
    const mockAlertService = { addWarning: vi.fn() };
    (database as any).alertService = mockAlertService;
    (database as any).TRANSIENT_ERROR_DELAY_MS = 0;
    (database as any).FETCH_TIMEOUT_MS = 60000;

    (PouchDB.fetch as Mock).mockImplementation(async () => {
      throw new TypeError("Failed to fetch");
    });

    // First call shows alert
    await expect(
      (database as any).defaultFetch(
        `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
        { headers: {} },
      ),
    ).rejects.toThrow();

    // Second call within cooldown should not show another alert
    await expect(
      (database as any).defaultFetch(
        `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
        { headers: {} },
      ),
    ).rejects.toThrow();

    expect(mockAlertService.addWarning).toHaveBeenCalledTimes(1);
  });

  it("should handle errors in periodic changes polling gracefully", async () => {
    vi.useFakeTimers();
    try {
      database.init("");

      const pouchDB = (database as any).pouchDB;
      let callCount = 0;
      vi.spyOn(pouchDB, "changes").mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({
          results: [{ doc: { _id: "Entity:1" }, seq: 1 }],
          last_seq: 1,
        });
      });

      const receivedDocs: any[] = [];
      const subscription = database.changes().subscribe((doc) => {
        receivedDocs.push(doc);
      });

      // First poll fails
      await vi.advanceTimersByTimeAsync(500);
      expect(pouchDB.changes).toHaveBeenCalledTimes(1);
      expect(receivedDocs.length).toBe(0);

      // Second poll succeeds
      await vi.advanceTimersByTimeAsync(10000);
      expect(pouchDB.changes).toHaveBeenCalledTimes(2);
      expect(receivedDocs.length).toBe(1);
      expect(receivedDocs[0]._id).toBe("Entity:1");

      subscription.unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should stop polling when database is destroyed", async () => {
    vi.useFakeTimers();
    try {
      database.init("");

      const pouchDB = (database as any).pouchDB;
      vi.spyOn(pouchDB, "changes").mockReturnValue(
        Promise.resolve({ results: [], last_seq: 0 }),
      );
      vi.spyOn(pouchDB, "destroy").mockReturnValue(Promise.resolve());

      database.changes().subscribe();

      await vi.advanceTimersByTimeAsync(0);
      expect(pouchDB.changes).toHaveBeenCalledTimes(1);

      // Destroy the database
      database.destroy();
      await vi.advanceTimersByTimeAsync(0);

      // Advance time - should not poll anymore
      (pouchDB.changes as Mock).mockClear();
      await vi.advanceTimersByTimeAsync(10000);
      expect(pouchDB.changes).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  describe("lostPermissions interception", () => {
    it("should accumulate lostPermissions from _changes responses intercepted in defaultFetch", async () => {
      database.init("");
      const lostPermissions = ["Child:1", "School:2"];

      // Call extractLostPermissions directly with a response containing lostPermissions
      const response = new Response(
        JSON.stringify({ last_seq: "42-xyz", results: [], lostPermissions }),
        { status: HttpStatusCode.Ok },
      );
      await (database as any).extractLostPermissions(response);

      const collected = (
        database as RemotePouchDatabase
      ).collectAndClearLostPermissions();
      expect(collected).toEqual(lostPermissions);
    });

    it("should not accumulate anything when lostPermissions field is absent", async () => {
      database.init("");

      const response = new Response(
        JSON.stringify({ last_seq: "5-seq", results: [] }),
        { status: HttpStatusCode.Ok },
      );
      await (database as any).extractLostPermissions(response);

      const collected = (
        database as RemotePouchDatabase
      ).collectAndClearLostPermissions();
      expect(collected).toEqual([]);
    });

    it("should reset after collectAndClearLostPermissions is called", async () => {
      database.init("");
      const response = new Response(
        JSON.stringify({
          results: [],
          last_seq: "1-seq",
          lostPermissions: ["X:1"],
        }),
        { status: HttpStatusCode.Ok },
      );
      await (database as any).extractLostPermissions(response);

      (database as RemotePouchDatabase).collectAndClearLostPermissions();
      const second = (
        database as RemotePouchDatabase
      ).collectAndClearLostPermissions();
      expect(second).toEqual([]);
    });

    it("should call extractLostPermissions for _changes URLs with 200 response", async () => {
      database.init("", { trackLostPermissions: true });
      vi.spyOn(database as any, "extractLostPermissions");
      (PouchDB.fetch as Mock).mockReturnValue(
        Promise.resolve(
          new Response(JSON.stringify({ results: [] }), {
            status: HttpStatusCode.Ok,
          }),
        ),
      );

      // Use defaultFetch directly with a _changes URL
      await (database as any).defaultFetch(
        `${environment.DB_PROXY_PREFIX}/app/_changes?since=0`,
        { headers: {} },
      );

      expect((database as any).extractLostPermissions).toHaveBeenCalled();
    });

    it("should not call extractLostPermissions for non-_changes URLs", async () => {
      database.init("");
      vi.spyOn(database as any, "extractLostPermissions");
      (PouchDB.fetch as Mock).mockReturnValue(
        Promise.resolve(
          new Response(JSON.stringify({ _id: "Entity:1" }), {
            status: HttpStatusCode.Ok,
          }),
        ),
      );

      await (database as any).defaultFetch(
        `${environment.DB_PROXY_PREFIX}/app/Entity:1`,
        { headers: {} },
      );

      expect((database as any).extractLostPermissions).not.toHaveBeenCalled();
    });
  });

  describe("4XX logging", () => {
    let warn: Mock;

    beforeEach(() => {
      // spy set up after the outer beforeEach, and cleared per test:
      // vi.spyOn returns the existing spy when one is already installed
      warn = vi.spyOn(Logging, "warn") as unknown as Mock;
      warn.mockClear();
    });

    afterEach(() => {
      // the shared teardown destroys the database, which fetches - leave the
      // mock succeeding again so it does not fail on this test's 4XX response
      (PouchDB.fetch as Mock).mockReturnValue(
        Promise.resolve(new Response("{}", { status: HttpStatusCode.Ok })),
      );
    });

    /** The DB response warnings logged, ignoring anything else the app logs. */
    const warningsLogged = () =>
      warn.mock.calls.filter(([message]) =>
        String(message).startsWith("Unexpected DB response"),
      );

    const fetch4xx = async (status: number, method?: string) => {
      database.init("");
      (PouchDB.fetch as Mock).mockReturnValue(
        Promise.resolve(new Response("{}", { status })),
      );
      await (database as any).defaultFetch(
        `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
        { headers: {}, method },
      );
    };

    it("should report the status and method of an unexpected 4XX, not an unserializable Response", async () => {
      // Reproduces AAM-DIGITAL-77H: passing the Response itself logged `context: [{}]`,
      // because a Response has no own enumerable properties - so the status,
      // the only thing distinguishing these failures, never reached monitoring.
      await fetch4xx(HttpStatusCode.BadRequest);

      const [, context] = warningsLogged()[0];
      expect(context).toEqual(
        expect.objectContaining({
          status: HttpStatusCode.BadRequest,
          method: "GET",
        }),
      );
      expect(JSON.stringify(context)).toContain("400");
    });

    it("should report each status under its own message, so monitoring separates the root causes", async () => {
      // the wording itself is covered by the http-response-logging spec; what
      // matters here is that two statuses do not end up in one bucket
      await fetch4xx(HttpStatusCode.BadRequest);
      await fetch4xx(HttpStatusCode.TooManyRequests);

      const [first, second] = warningsLogged().map(([message]) => message);
      expect(first).not.toEqual(second);
    });

    it("should keep the numeric status in the context of an unnamed 4XX", async () => {
      await fetch4xx(423); // Locked - not one we expect from CouchDB

      expect(warningsLogged()[0][1]).toEqual(
        expect.objectContaining({ status: 423 }),
      );
    });

    it("should not report expected 4XX statuses as warnings", async () => {
      await fetch4xx(HttpStatusCode.Forbidden);

      expect(warningsLogged()).toEqual([]);
    });

    it("should not report a conflict as a warning, as only the caller knows its outcome", async () => {
      // a 409 is always surfaced to whoever made the write - either
      // PouchDatabase.resolveConflict or PouchDB's own replication - so warning
      // here alerts on something nobody can act on
      await fetch4xx(HttpStatusCode.Conflict, "PUT");

      expect(warningsLogged()).toEqual([]);
    });
  });

  describe("find", () => {
    it("sends limit and bookmark to the _find endpoint and returns the response's docs and bookmark", async () => {
      database.init("");

      let requestBody: any;
      (PouchDB.fetch as Mock).mockImplementation(async (url: string, opts) => {
        if (typeof url === "string" && url.includes("/_find")) {
          requestBody = JSON.parse(opts.body as string);
          return new Response(
            JSON.stringify({
              docs: [{ _id: "Test:3" }],
              bookmark: "next-bookmark",
            }),
            { status: HttpStatusCode.Ok },
          );
        }
        return new Response("{}", { status: HttpStatusCode.Ok });
      });

      const res = await (database as RemotePouchDatabase).find(
        "Test",
        {},
        { limit: 1, bookmark: "prev-bookmark" },
      );

      expect(requestBody).toEqual(
        expect.objectContaining({ limit: 1, bookmark: "prev-bookmark" }),
      );
      expect(res).toEqual({
        docs: [{ _id: "Test:3" }],
        bookmark: "next-bookmark",
      });
    });

    it("does not send a bookmark for the first page", async () => {
      database.init("");

      let requestBody: any;
      (PouchDB.fetch as Mock).mockImplementation(async (url: string, opts) => {
        if (typeof url === "string" && url.includes("/_find")) {
          requestBody = JSON.parse(opts.body as string);
          return new Response(JSON.stringify({ docs: [], bookmark: "bm1" }), {
            status: HttpStatusCode.Ok,
          });
        }
        return new Response("{}", { status: HttpStatusCode.Ok });
      });

      await (database as RemotePouchDatabase).find("Test", {}, { limit: 5 });

      expect(requestBody.bookmark).toBeUndefined();
    });

    it("projects to only the _id when idOnly is set, so no doc content is transferred", async () => {
      database.init("");

      let requestBody: any;
      (PouchDB.fetch as Mock).mockImplementation(async (url: string, opts) => {
        if (typeof url === "string" && url.includes("/_find")) {
          requestBody = JSON.parse(opts.body as string);
          return new Response(JSON.stringify({ docs: [], bookmark: "bm1" }), {
            status: HttpStatusCode.Ok,
          });
        }
        return new Response("{}", { status: HttpStatusCode.Ok });
      });

      await (database as RemotePouchDatabase).find(
        "Test",
        {},
        { limit: 5 },
        undefined,
        { idOnly: true },
      );

      expect(requestBody.fields).toEqual(["_id"]);
    });
  });

  describe("shouldSkipIndexUpdate", () => {
    it("should skip update if existing design doc has a newer aam_version", () => {
      const remoteDb = database as RemotePouchDatabase;
      const appVersionBefore = environment.appVersion;
      environment.appVersion = "1.0.0";

      try {
        const result = (remoteDb as any).shouldSkipIndexUpdate({
          _id: "_design/test",
          aam_version: "v99.0.0",
        });
        expect(result).toBe(true);
      } finally {
        environment.appVersion = appVersionBefore;
      }
    });

    it("should not skip update if existing design doc has an older aam_version", () => {
      const remoteDb = database as RemotePouchDatabase;
      const appVersionBefore = environment.appVersion;
      environment.appVersion = "1.0.0";

      try {
        const result = (remoteDb as any).shouldSkipIndexUpdate({
          _id: "_design/test",
          aam_version: "0.0.1",
        });
        expect(result).toBe(false);
      } finally {
        environment.appVersion = appVersionBefore;
      }
    });

    it("should not skip update if existing design doc has no aam_version", () => {
      const remoteDb = database as RemotePouchDatabase;
      const result = (remoteDb as any).shouldSkipIndexUpdate({
        _id: "_design/test",
      });
      expect(result).toBe(false);
    });

    it("should not skip update when server version is 9.0.0 and client is 10.0.0", () => {
      const remoteDb = database as RemotePouchDatabase;
      const appVersionBefore = environment.appVersion;
      environment.appVersion = "10.0.0";

      try {
        const result = (remoteDb as any).shouldSkipIndexUpdate({
          _id: "_design/test",
          aam_version: "9.0.0",
        });
        expect(result).toBe(false);
      } finally {
        environment.appVersion = appVersionBefore;
      }
    });

    it("should skip update when server version is 10.2.0 and client is 10.1.9", () => {
      const remoteDb = database as RemotePouchDatabase;
      const appVersionBefore = environment.appVersion;
      environment.appVersion = "10.1.9";

      try {
        const result = (remoteDb as any).shouldSkipIndexUpdate({
          _id: "_design/test",
          aam_version: "10.2.0",
        });
        expect(result).toBe(true);
      } finally {
        environment.appVersion = appVersionBefore;
      }
    });

    it("should not skip update when server version is 10.0 and client is 10.0.0", () => {
      const remoteDb = database as RemotePouchDatabase;
      const appVersionBefore = environment.appVersion;
      environment.appVersion = "10.0.0";

      try {
        const result = (remoteDb as any).shouldSkipIndexUpdate({
          _id: "_design/test",
          aam_version: "10.0",
        });
        expect(result).toBe(false);
      } finally {
        environment.appVersion = appVersionBefore;
      }
    });
  });
});
