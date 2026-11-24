import { Location } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Event, NavigationStart, Router } from "@angular/router";
import { Subject } from "rxjs";
import { UrlStateService } from "#src/app/utils/url-state/url-state.service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { InMemoryDataSource } from "../data-source/in-memory-data-source";
import type { Mock } from "vitest";
import {
  FREE_TEXT_URL_UPDATE_DELAY_MS,
  FreeTextFilterComponent,
} from "./free-text-filter.component";

describe("FreeTextFilterComponent", () => {
  let fixture: ComponentFixture<FreeTextFilterComponent>;
  let dataSource: InMemoryDataSource<TestEntity>;
  let urlState: {
    getUrlParam: ReturnType<typeof vi.fn>;
    updateUrlParams: ReturnType<typeof vi.fn>;
  };

  function createComponent(searchTextInUrl: string | null = null) {
    urlState = {
      getUrlParam: vi
        .fn()
        .mockImplementation((key) =>
          key === "_search" ? searchTextInUrl : null,
        ),
      updateUrlParams: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [FreeTextFilterComponent, MockedTestingModule.withState()],
      providers: [{ provide: UrlStateService, useValue: urlState }],
    });
    dataSource = TestBed.runInInjectionContext(
      () => new InMemoryDataSource<TestEntity>(),
    );
    fixture = TestBed.createComponent(FreeTextFilterComponent);
    fixture.componentRef.setInput("dataSource", dataSource);
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it("restores the search text from the URL without writing it back", async () => {
    vi.useFakeTimers();
    createComponent("Alipore");
    await vi.advanceTimersByTimeAsync(FREE_TEXT_URL_UPDATE_DELAY_MS);

    expect(dataSource.searchText()).toBe("Alipore");
    expect(urlState.updateUrlParams).not.toHaveBeenCalled();
  });

  it("writes the search text to the URL once typing pauses", async () => {
    vi.useFakeTimers();
    createComponent();

    dataSource.searchText.set("Ali");
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(FREE_TEXT_URL_UPDATE_DELAY_MS / 2);
    dataSource.searchText.set("Alipore");
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(FREE_TEXT_URL_UPDATE_DELAY_MS);

    expect(urlState.updateUrlParams).toHaveBeenCalledTimes(1);
    expect(urlState.updateUrlParams).toHaveBeenCalledWith({
      _search: "Alipore",
    });
  });

  describe("when the user leaves the list before the delay has passed", () => {
    let router: Router;
    let replaceState: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.useFakeTimers();
      createComponent();
      router = TestBed.inject(Router);
      vi.spyOn(router, "url", "get").mockReturnValue("/event?team=abc");
      const location = TestBed.inject(Location);
      replaceState = vi.spyOn(location, "replaceState").mockReturnValue();
      vi.spyOn(location, "getState").mockReturnValue({ navigationId: 3 });
      dataSource.searchText.set("Ali");
      fixture.detectChanges();
    });

    function startNavigationTo(url: string) {
      (router.events as Subject<Event>).next(new NavigationStart(1, url));
    }

    it("keeps the search text in the history entry of the list", () => {
      startNavigationTo("/event/123");

      expect(replaceState).toHaveBeenCalledWith(
        "/event?team=abc&_search=Ali",
        "",
        { navigationId: 3 },
      );
    });

    it("does not touch the history for a change of the same page", () => {
      startNavigationTo("/event?team=xyz");

      expect(replaceState).not.toHaveBeenCalled();
    });
  });

  it("removes the URL param when the search text is cleared", async () => {
    vi.useFakeTimers();
    createComponent("Alipore");

    dataSource.searchText.set("");
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(FREE_TEXT_URL_UPDATE_DELAY_MS);

    expect(urlState.updateUrlParams).toHaveBeenCalledWith({ _search: null });
  });
});
