import { TestBed } from "@angular/core/testing";

import { ThirdPartyAuthenticationService } from "./third-party-authentication.service";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { HttpClient, provideHttpClient } from "@angular/common/http";

describe("ThirdPartyAuthenticationService", () => {
  let service: ThirdPartyAuthenticationService;

  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ThirdPartyAuthenticationService);

    httpTesting = TestBed.inject(HttpTestingController);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should not make API request if no session was found", async () => {
    spyOn(localStorage, "getItem").and.returnValue(null);
    TestBed.inject(HttpClient);

    httpTesting.expectNone(() => true);
    const result = await service.getRedirectUrl();

    expect(result).toBeUndefined();
  });
});
