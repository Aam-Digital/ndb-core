import { TestBed } from "@angular/core/testing";

import { AcceptLanguageInterceptor } from "./accept-language.interceptor";
import { LOCALE_ID } from "@angular/core";
import { HttpRequest } from "@angular/common/http";

describe("AcceptLanguageInterceptor", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        AcceptLanguageInterceptor,
        { provide: LOCALE_ID, useValue: "de" },
      ],
    }),
  );

  it("should be created", () => {
    const interceptor = TestBed.inject(AcceptLanguageInterceptor);
    expect(interceptor).toBeTruthy();
  });

  it("should add the Accept-Language header with the given locale", () => {
    const handleSpy = jasmine.createSpy();
    const request = new HttpRequest("GET", "https://some.url/");
    const interceptor = TestBed.inject(AcceptLanguageInterceptor);

    interceptor.intercept(request, { handle: handleSpy });
    const res = handleSpy.calls.mostRecent().args[0];

    expect(res.headers.get("Accept-Language")).toBe("de");
  });
});
