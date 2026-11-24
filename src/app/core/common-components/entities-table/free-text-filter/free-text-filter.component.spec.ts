import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UrlStateService } from "#src/app/utils/url-state/url-state.service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { InMemoryDataSource } from "../data-source/in-memory-data-source";
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

  it("removes the URL param when the search text is cleared", async () => {
    vi.useFakeTimers();
    createComponent("Alipore");

    dataSource.searchText.set("");
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(FREE_TEXT_URL_UPDATE_DELAY_MS);

    expect(urlState.updateUrlParams).toHaveBeenCalledWith({ _search: null });
  });
});
