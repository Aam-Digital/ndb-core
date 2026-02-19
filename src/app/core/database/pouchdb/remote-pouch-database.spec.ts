import { PouchDatabase } from "./pouch-database";
import { fakeAsync, tick } from "@angular/core/testing";
import PouchDB from "pouchdb-browser";
import { HttpStatusCode } from "@angular/common/http";
import { RemotePouchDatabase } from "./remote-pouch-database";
import { SyncStateSubject } from "app/core/session/session-type";
import { environment } from "environments/environment";

describe("RemotePouchDatabase tests", () => {
  let database: PouchDatabase;

  let mockAuthService: jasmine.SpyObj<any>;
  let syncStateSubject: SyncStateSubject;

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    mockAuthService = jasmine.createSpyObj(["login", "addAuthHeader"]);
    mockAuthService.addAuthHeader.and.callFake(() => {});
    // Prevent real HTTP requests from PouchDB during tests
    spyOn(PouchDB, "fetch").and.returnValue(
      Promise.resolve(new Response("{}", { status: HttpStatusCode.Ok })),
    );
    database = new RemotePouchDatabase(
      "unit-test-db",
      mockAuthService,
      syncStateSubject,
    );
  });

  afterEach(() => database.destroy());

  it("should try auto-login if fetch fails and fetch again", fakeAsync(() => {
    database.init("");

    mockAuthService.login.and.resolveTo();
    // providing "valid" token on second call
    let calls = 0;
    mockAuthService.addAuthHeader.and.callFake((headers) => {
      headers.Authorization = calls % 2 === 1 ? "valid" : "invalid";
    });
    (PouchDB.fetch as jasmine.Spy).and.callFake(async (url, opts) => {
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

    database.get("Entity:ABC");
    tick();
    tick();

    expect(PouchDB.fetch).toHaveBeenCalledTimes(2);
    expect(mockAuthService.login).toHaveBeenCalled();
    expect(mockAuthService.addAuthHeader).toHaveBeenCalledTimes(2);
  }));

  it("should use periodic polling for changes feed instead of live long-polling", fakeAsync(() => {
    database.init("");

    const mockChangesResult = {
      results: [
        { doc: { _id: "Entity:1", name: "Test Doc 1" }, seq: 1 },
        { doc: { _id: "Entity:2", name: "Test Doc 2" }, seq: 2 },
      ],
      last_seq: 2,
    };

    const pouchDB = (database as any).pouchDB;
    spyOn(pouchDB, "changes").and.returnValue(
      Promise.resolve(mockChangesResult),
    );

    const receivedDocs: any[] = [];
    const subscription = database.changes().subscribe((doc) => {
      receivedDocs.push(doc);
    });

    // Should not call changes immediately (waits for interval)
    expect(pouchDB.changes).not.toHaveBeenCalled();

    // Advance time by polling interval (10 seconds)
    tick();

    // Now changes should have been polled
    expect(pouchDB.changes).toHaveBeenCalledWith({
      since: "now",
      include_docs: true,
    });
    expect(receivedDocs.length).toBe(2);
    expect(receivedDocs[0]._id).toBe("Entity:1");
    expect(receivedDocs[1]._id).toBe("Entity:2");

    // Advance time for second poll
    (pouchDB.changes as jasmine.Spy).calls.reset();
    mockChangesResult.results = [
      { doc: { _id: "Entity:3", name: "Test Doc 3" }, seq: 3 },
    ];
    mockChangesResult.last_seq = 3;

    tick(10_000);

    // Should poll again with last_seq from previous result
    expect(pouchDB.changes).toHaveBeenCalledWith({
      since: 2,
      include_docs: true,
    });
    expect(receivedDocs.length).toBe(3);
    expect(receivedDocs[2]._id).toBe("Entity:3");

    subscription.unsubscribe();
  }));

  it("should handle errors in periodic changes polling gracefully", fakeAsync(() => {
    database.init("");

    const pouchDB = (database as any).pouchDB;
    let callCount = 0;
    spyOn(pouchDB, "changes").and.callFake(() => {
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
    tick(500);
    expect(pouchDB.changes).toHaveBeenCalledTimes(1);
    expect(receivedDocs.length).toBe(0);

    // Second poll succeeds
    tick(10_000);
    expect(pouchDB.changes).toHaveBeenCalledTimes(2);
    expect(receivedDocs.length).toBe(1);
    expect(receivedDocs[0]._id).toBe("Entity:1");

    subscription.unsubscribe();
  }));

  it("should stop polling when database is destroyed", fakeAsync(() => {
    database.init("");

    const pouchDB = (database as any).pouchDB;
    spyOn(pouchDB, "changes").and.returnValue(
      Promise.resolve({ results: [], last_seq: 0 }),
    );
    spyOn(pouchDB, "destroy").and.returnValue(Promise.resolve());

    database.changes().subscribe();

    tick();
    expect(pouchDB.changes).toHaveBeenCalledTimes(1);

    // Destroy the database
    database.destroy();
    tick();

    // Advance time - should not poll anymore
    (pouchDB.changes as jasmine.Spy).calls.reset();
    tick(10000);
    expect(pouchDB.changes).not.toHaveBeenCalled();
  }));

  describe("lostPermissions interception", () => {
    it("should accumulate lostPermissions from _changes responses intercepted in defaultFetch", async () => {
      database.init("");
      const lostPermissions = [
        { _id: "Child:1", _rev: "3-abc" },
        { _id: "School:2", _rev: "2-def" },
      ];

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
          lostPermissions: [{ _id: "X:1", _rev: "1-a" }],
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
      database.init("");
      spyOn(database as any, "extractLostPermissions");
      (PouchDB.fetch as jasmine.Spy).and.returnValue(
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
      spyOn(database as any, "extractLostPermissions");
      (PouchDB.fetch as jasmine.Spy).and.returnValue(
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
