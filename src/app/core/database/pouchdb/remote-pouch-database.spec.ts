import { PouchDatabase } from "./pouch-database";
import { fakeAsync, tick } from "@angular/core/testing";
import PouchDB from "pouchdb-browser";
import { HttpStatusCode } from "@angular/common/http";
import { RemotePouchDatabase } from "./remote-pouch-database";

describe("RemotePouchDatabase tests", () => {
  let database: PouchDatabase;

  let mockAuthService: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj(["login", "addAuthHeader"]);
    database = new RemotePouchDatabase("unit-test-db", mockAuthService);
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
    spyOn(PouchDB, "fetch").and.callFake(async (url, opts) => {
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
});
