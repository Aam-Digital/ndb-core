import { TestBed } from "@angular/core/testing";

import { ThirdPartyAuthenticationService } from "./third-party-authentication.service";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { HttpClient, provideHttpClient, withXhr } from "@angular/common/http";

describe("ThirdPartyAuthenticationService", () => {
  let service: ThirdPartyAuthenticationService;

  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ThirdPartyAuthenticationService);

    httpTesting = TestBed.inject(HttpTestingController);
  });

  it("should not make API request if no session was found", async () => {
    vi.spyOn(localStorage, "getItem").mockReturnValue(null);
    TestBed.inject(HttpClient);

    httpTesting.expectNone(() => true);
    const result = await service.getRedirectUrl();

    expect(result).toBeUndefined();
  });
});
