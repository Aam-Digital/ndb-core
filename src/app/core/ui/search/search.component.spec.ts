import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { SearchComponent } from "./search.component";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { Subscription } from "rxjs";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("SearchComponent", () => {
  SearchComponent.INPUT_DEBOUNCE_TIME_MS = 4;

  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  let mockIndexService: jasmine.SpyObj<DatabaseIndexingService>;
  let subscription: Subscription;

  beforeEach(waitForAsync(() => {
    mockIndexService = jasmine.createSpyObj("mockIndexService", [
      "queryIndexRaw",
      "createIndex",
    ]);
    mockIndexService.createIndex.and.resolveTo();
    mockIndexService.queryIndexRaw.and.resolveTo({ rows: [] });

    TestBed.configureTestingModule({
      imports: [SearchComponent, MockedTestingModule.withState()],
      providers: [
        { provide: DatabaseIndexingService, useValue: mockIndexService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockIndexService.createIndex.and.resolveTo();
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    subscription?.unsubscribe();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
    expect(mockIndexService.createIndex).toHaveBeenCalled();
  });

  it("should not search for less than MIN_CHARACTERS_FOR_SEARCH character of input", fakeAsync(() => {
    const subscr = component.results.subscribe();

    component.formControl.setValue("A");
    tick(SearchComponent.INPUT_DEBOUNCE_TIME_MS * 2);
    expect(component.state).toBe(component.TOO_FEW_CHARACTERS);
    expect(mockIndexService.queryIndexRaw).not.toHaveBeenCalled();

    component.formControl.setValue("AB");
    tick(SearchComponent.INPUT_DEBOUNCE_TIME_MS * 2);
    expect(component.state).toBe(component.NO_RESULTS);
    expect(mockIndexService.queryIndexRaw).toHaveBeenCalled();

    subscr.unsubscribe();
  }));

  function expectResultToBeEmpty(done: DoneFn) {
    subscription = component.results.subscribe((next) => {
      expect(next).toBeEmpty();
      expect(mockIndexService.queryIndexRaw).not.toHaveBeenCalled();
      done();
    });
  }

  it("should not search for less than one real character of input", (done) => {
    expectResultToBeEmpty(done);
    component.formControl.setValue("   ");
  });

  it("should reset results if a a null search is performed", (done) => {
    expectResultToBeEmpty(done);
    component.formControl.setValue(null);
  });
});
