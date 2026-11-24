import { Location } from "@angular/common";
import { signal, WritableSignal } from "@angular/core";
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
  let searchTextInUrl: WritableSignal<string | null>;
  let urlState: {
    watchUrlParam: ReturnType<typeof vi.fn>;
    updateUrlParams: ReturnType<typeof vi.fn>;
  };

  function createComponent(initialSearchTextInUrl: string | null = null) {
    searchTextInUrl = signal(initialSearchTextInUrl);
    urlState = {
      watchUrlParam: vi
        .fn()
        .mockImplementation((key) =>
          key === "_search" ? searchTextInUrl : signal(null),
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

  it("follows the URL when the user goes back or forward in the browser history", async () => {
    vi.useFakeTimers();
    createComponent("Alipore");

    searchTextInUrl.set(null);
    fixture.detectChanges();
    expect(dataSource.searchText()).toBe("");

    searchTextInUrl.set("Bob");
    fixture.detectChanges();
    expect(dataSource.searchText()).toBe("Bob");

    await vi.advanceTimersByTimeAsync(FREE_TEXT_URL_UPDATE_DELAY_MS);
    expect(urlState.updateUrlParams).not.toHaveBeenCalled();
  });

  it("keeps the text the user went on typing when an earlier write reaches the URL", async () => {
    vi.useFakeTimers();
    createComponent();
    dataSource.searchText.set("Ali");
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(FREE_TEXT_URL_UPDATE_DELAY_MS);
    dataSource.searchText.set("Alic");
    fixture.detectChanges();

    searchTextInUrl.set("Ali");
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(FREE_TEXT_URL_UPDATE_DELAY_MS);

    expect(dataSource.searchText()).toBe("Alic");
    expect(urlState.updateUrlParams).toHaveBeenLastCalledWith({
      _search: "Alic",
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

    it("does not touch the history once the text is written to the URL", () => {
      vi.advanceTimersByTime(FREE_TEXT_URL_UPDATE_DELAY_MS);

      startNavigationTo("/event/123");

      expect(replaceState).not.toHaveBeenCalled();
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
