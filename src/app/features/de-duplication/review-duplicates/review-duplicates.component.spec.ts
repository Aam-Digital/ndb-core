import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { of, Subject } from "rxjs";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { ReviewDuplicatesComponent } from "./review-duplicates.component";
import {
  DuplicateDetectionService,
  DuplicatePair,
} from "../duplicate-detection.service";
import { BulkMergeService } from "../bulk-merge-service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { mockEntityMapperProvider } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { createFakeStorage } from "../../../utils/test-utils/fake-storage";
import { LOCAL_STORAGE_TOKEN } from "../../../utils/di-tokens";

describe("ReviewDuplicatesComponent", () => {
  let component: ReviewDuplicatesComponent;
  let fixture: ComponentFixture<ReviewDuplicatesComponent>;

  /** the analyses handed out by the mocked service, in the order they were started */
  let analyses: Subject<DuplicatePair[]>[];

  beforeEach(async () => {
    analyses = [];

    await TestBed.configureTestingModule({
      imports: [ReviewDuplicatesComponent, CoreTestingModule],
      providers: [
        ...mockEntityMapperProvider(),
        {
          provide: DuplicateDetectionService,
          useValue: {
            watchDuplicates: () => {
              const analysis = new Subject<DuplicatePair[]>();
              analyses.push(analysis);
              return analysis;
            },
          },
        },
        { provide: BulkMergeService, useValue: { executeAction: () => {} } },
        // the paginator persists its page size there
        { provide: LOCAL_STORAGE_TOKEN, useValue: createFakeStorage() },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    // the template renders icons, which AppModule registers at startup
    TestBed.inject(FaIconLibrary).addIconPacks(fas, far);

    fixture = TestBed.createComponent(ReviewDuplicatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function startSearch(fields = ["name"]) {
    component.selectedEntityType.set(TestEntity.ENTITY_TYPE);
    component.selectedFields.set(fields);
    component.search();
    fixture.detectChanges();
  }

  function pair(name: string): DuplicatePair {
    return {
      record: TestEntity.create({ name }),
      possibleDuplicate: TestEntity.create({ name }),
    };
  }

  function pairs(...names: string[]): DuplicatePair[] {
    return names.map(pair);
  }

  /** the rows the table is handed, i.e. the current page of the data source */
  function renderedRecords(): string[] {
    let rows: DuplicatePair[];
    component.dataSource
      .connect()
      .subscribe((r) => (rows = r))
      .unsubscribe();
    return rows.map(({ record }) => (record as TestEntity).name);
  }

  /** page the list as the user would, through the paginator the table is bound to */
  function goToPage(pageIndex: number, pageSize: number) {
    const paginator = component.dataSource.paginator;
    paginator.pageSize = pageSize;
    paginator.pageIndex = pageIndex;
    paginator.page.emit({ pageIndex, pageSize, length: paginator.length });
    fixture.detectChanges();
  }

  const SIX_PAIRS = ["old-1", "old-2", "old-3", "old-4", "old-5", "old-6"];

  it("moves back a page when the list shrinks below the current one", async () => {
    startSearch();
    analyses[0].next(pairs(...SIX_PAIRS));
    fixture.detectChanges();

    goToPage(1, 5);
    expect(renderedRecords()).toEqual(["old-6"]);

    // resolving duplicates leaves too few pairs for a second page
    analyses[0].next(pairs("old-1"));
    // the effect hands the shortened list to the data source, which then clamps
    // the now out-of-range page index in a microtask of its own
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.dataSource.paginator.pageIndex).toBe(0);
    expect(renderedRecords()).toEqual(["old-1"]);
  });

  it("starts a new search on the first page", async () => {
    startSearch();
    analyses[0].next(pairs(...SIX_PAIRS));
    fixture.detectChanges();

    goToPage(1, 5);
    expect(component.dataSource.paginator.pageIndex).toBe(1);

    // a result available right away keeps the list (and with it the paginator)
    // alive across the new search; a set just as long must still not leave the
    // user on the page they were on
    vi.spyOn(
      TestBed.inject(DuplicateDetectionService),
      "watchDuplicates",
    ).mockReturnValueOnce(
      of(pairs("new-1", "new-2", "new-3", "new-4", "new-5", "new-6")),
    );
    startSearch(["name", "other"]);

    expect(component.dataSource.paginator.pageIndex).toBe(0);
    expect(renderedRecords()).toEqual([
      "new-1",
      "new-2",
      "new-3",
      "new-4",
      "new-5",
    ]);
  });

  it("ignores the previous analysis once a new search is started", () => {
    startSearch();
    const abandoned = analyses[0];

    startSearch(["name", "other"]);
    expect(analyses).toHaveLength(2);

    abandoned.next([pair("stale")]);
    fixture.detectChanges();

    expect(component.pairs()).toEqual([]);
    expect(abandoned.observed).toBe(false);
  });

  it("stops the analysis when the search is cleared", () => {
    startSearch();
    const analysis = analyses[0];
    analysis.next([pair("a")]);
    fixture.detectChanges();
    expect(component.pairs()).toHaveLength(1);

    component.clear();
    fixture.detectChanges();

    expect(analysis.observed).toBe(false);
    expect(component.pairs()).toEqual([]);
    expect(component.searched()).toBe(false);
  });

  it("does not start an analysis without an entity type or fields", () => {
    component.selectedEntityType.set(TestEntity.ENTITY_TYPE);
    component.selectedFields.set([]);
    component.search();
    fixture.detectChanges();

    expect(analyses).toHaveLength(0);
    expect(component.isLoading()).toBe(false);
  });
});
