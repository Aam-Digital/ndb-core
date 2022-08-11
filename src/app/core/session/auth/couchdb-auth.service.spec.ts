import { TestBed } from "@angular/core/testing";

import { CouchdbAuthService } from "./couchdb-auth.service";

describe("CouchdbAuthService", () => {
  let service: CouchdbAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CouchdbAuthService],
    });
    service = TestBed.inject(CouchdbAuthService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
