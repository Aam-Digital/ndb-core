import { TestBed } from "@angular/core/testing";
import { NavigationEnd, Router } from "@angular/router";
import { Subject } from "rxjs";
import { PreviousPageService } from "./previous-page.service";

describe("PreviousPageService", () => {
  let service: PreviousPageService;
  let routerEvents: Subject<NavigationEnd>;

  beforeEach(() => {
    routerEvents = new Subject<NavigationEnd>();
    TestBed.configureTestingModule({
      providers: [
        PreviousPageService,
        { provide: Router, useValue: { events: routerEvents, url: "/" } },
      ],
    });
    service = TestBed.inject(PreviousPageService);
  });

  function navigateTo(...urls: string[]) {
    urls.forEach((url, i) => routerEvents.next(new NavigationEnd(i, url, url)));
  }

  it.each([
    ["no navigation yet", [], undefined],
    [
      "the page before the current one, with its query params",
      ["/event?team=abc&_sortBy=date", "/event/1"],
      "/event?team=abc&_sortBy=date",
    ],
    [
      "not changed by query params of the current page, e.g. a selected tab",
      ["/event?team=abc", "/event/1", "/event/1?_tabIndex=0"],
      "/event?team=abc",
    ],
    [
      "the page before, not changed by filters set on the current page",
      ["/event", "/event?team=abc"],
      "/",
    ],
  ])("remembers %s", (_, navigations, expectedPreviousPage) => {
    navigateTo(...navigations);

    expect(service.getPreviousPageUrl()).toBe(expectedPreviousPage);
  });
});
