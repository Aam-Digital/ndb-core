import { TestBed } from "@angular/core/testing";

import { GeoService } from "./geo.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("GeoService", () => {
  let service: GeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(GeoService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
