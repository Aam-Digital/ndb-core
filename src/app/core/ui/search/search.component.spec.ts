import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SearchComponent } from "./search.component";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { firstValueFrom, Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import type { Mock } from "vitest";

type DatabaseIndexingServiceMock = Pick<
  DatabaseIndexingService,
  "queryIndexRaw" | "createIndex"
> & {
  queryIndexRaw: Mock;
  createIndex: Mock;
};

describe("SearchComponent", () => {
  SearchComponent.INPUT_DEBOUNCE_TIME_MS = 4;

  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  let mockIndexService: DatabaseIndexingServiceMock;
  let subscription: Subscription;

  beforeEach(waitForAsync(() => {
    mockIndexService = {
      queryIndexRaw: vi.fn().mockName("mockIndexService.queryIndexRaw"),
      createIndex: vi.fn().mockName("mockIndexService.createIndex"),
    };
    mockIndexService.createIndex.mockResolvedValue(undefined);
    mockIndexService.queryIndexRaw.mockResolvedValue({ rows: [] });

    TestBed.configureTestingModule({
      imports: [SearchComponent, MockedTestingModule.withState()],
      providers: [
        { provide: DatabaseIndexingService, useValue: mockIndexService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockIndexService.createIndex.mockResolvedValue(undefined);
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    subscription?.unsubscribe();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not search for less than MIN_CHARACTERS_FOR_SEARCH character of input", async () => {
    vi.useFakeTimers();
    try {
      const subscr = component.results.subscribe();

      component.formControl.setValue("A");
      await vi.advanceTimersByTimeAsync(
        SearchComponent.INPUT_DEBOUNCE_TIME_MS * 2,
      );
      expect(component.state).toBe(component.TOO_FEW_CHARACTERS);
      expect(mockIndexService.queryIndexRaw).not.toHaveBeenCalled();

      component.formControl.setValue("AB");
      await vi.advanceTimersByTimeAsync(
        SearchComponent.INPUT_DEBOUNCE_TIME_MS * 2,
      );
      expect(component.state).toBe(component.NO_RESULTS);
      expect(mockIndexService.queryIndexRaw).toHaveBeenCalled();

      subscr.unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should search for mixed alphanumeric input", async () => {
    vi.useFakeTimers();
    try {
      const subscr = component.results.subscribe();

      component.formControl.setValue("10012bcfg");
      await vi.advanceTimersByTimeAsync(
        SearchComponent.INPUT_DEBOUNCE_TIME_MS * 2,
      );

      expect(component.state).toBe(component.NO_RESULTS);
      expect(mockIndexService.queryIndexRaw).toHaveBeenCalled();

      subscr.unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should trim leading and trailing spaces before searching", async () => {
    vi.useFakeTimers();
    try {
      const subscr = component.results.subscribe();

      component.formControl.setValue("  AB  ");
      await vi.advanceTimersByTimeAsync(
        SearchComponent.INPUT_DEBOUNCE_TIME_MS * 2,
      );

      expect(component.state).toBe(component.NO_RESULTS);
      expect(mockIndexService.queryIndexRaw).toHaveBeenCalled();

      subscr.unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });

  async function expectResultToBeEmpty() {
    const next = await firstValueFrom(component.results.pipe(take(1)));
    expect(next).toEqual([]);
    expect(mockIndexService.queryIndexRaw).not.toHaveBeenCalled();
  }

  it("should not search for less than one real character of input", async () => {
    const assertion = expectResultToBeEmpty();
    component.formControl.setValue("   ");
    await assertion;
  });

  it("should reset results if a a null search is performed", async () => {
    const assertion = expectResultToBeEmpty();
    component.formControl.setValue(null);
    await assertion;
  });
});
