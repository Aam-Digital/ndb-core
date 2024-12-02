import { TestBed } from "@angular/core/testing";

import { EscoApiService } from "./esco-api.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("EscoApiService", () => {
  let service: EscoApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EscoApiService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
