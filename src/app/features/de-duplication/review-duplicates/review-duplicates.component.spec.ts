import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
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

  it("moves back a page when the list shrinks below the current one", () => {
    startSearch();
    analyses[0].next([
      pair("a"),
      pair("b"),
      pair("c"),
      pair("d"),
      pair("e"),
      pair("f"),
    ]);
    fixture.detectChanges();

    component.onPageChange({ pageIndex: 1, pageSize: 5, length: 6 });
    fixture.detectChanges();
    expect(component.pageIndex()).toBe(1);

    // resolving duplicates leaves too few pairs for a second page
    analyses[0].next([pair("a")]);
    fixture.detectChanges();

    expect(component.pageIndex()).toBe(0);
    expect(component.paginatedPairs()).toHaveLength(1);
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
