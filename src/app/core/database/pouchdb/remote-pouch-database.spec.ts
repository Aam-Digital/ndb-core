import type { Mock } from "vitest";
import { PouchDatabase } from "./pouch-database";
import PouchDB from "pouchdb-browser";
import { HttpStatusCode } from "@angular/common/http";
import { RemotePouchDatabase } from "./remote-pouch-database";
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
    mockAuthService.addAuthHeader.mockImplementation((headers) => {
      headers.Authorization = calls % 2 === 1 ? "valid" : "invalid";
    });
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

  it("should retry on transient network errors", async () => {
    database.init("");

    let callCount = 0;
    (PouchDB.fetch as Mock).mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        throw new TypeError("Failed to fetch");
      }
      return new Response("{}", { status: HttpStatusCode.Ok });
    });

    const result = await (database as any).fetchWithTransientRetry(
      `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
      { headers: new Headers() },
    );

    expect(callCount).toBe(3);
    expect(result.status).toBe(HttpStatusCode.Ok);
  });

  it("should throw after exhausting transient retries", async () => {
    (database as any).TRANSIENT_ERROR_DELAY_MS = 0;

    let callCount = 0;
    (PouchDB.fetch as Mock).mockImplementation(async () => {
      callCount++;
      throw new TypeError("Failed to fetch");
    });

    await expect(
      (database as any).fetchWithTransientRetry(
        `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
        { headers: new Headers() },
      ),
    ).rejects.toThrow(TypeError);

    // 1 initial + 2 retries = 3 total
    expect(callCount).toBe(3);
  });

  it("should not retry on non-TypeError errors", async () => {
    (database as any).TRANSIENT_ERROR_DELAY_MS = 0;

    let callCount = 0;
    (PouchDB.fetch as Mock).mockImplementation(async () => {
      callCount++;
      throw new Error("Some other error");
    });

    await expect(
      (database as any).fetchWithTransientRetry(
        `${environment.DB_PROXY_PREFIX}/unit-test-db/Entity:ABC`,
        { headers: new Headers() },
      ),
    ).rejects.toThrow(Error);

    // no retries for non-TypeError
    expect(callCount).toBe(1);
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
});
