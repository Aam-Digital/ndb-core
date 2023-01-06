import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { SearchComponent } from "./search.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { Subscription } from "rxjs";
import { Entity } from "../../entity/model/entity";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SwUpdate } from "@angular/service-worker";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";

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
        UserRoleGuard,
        { provide: DatabaseIndexingService, useValue: mockIndexService },
        { provide: SwUpdate, useValue: {} },
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
    expect(component.state).toBe(component.TOO_FEW_CHARACTERS);
    expect(mockIndexService.queryIndexRaw).not.toHaveBeenCalled();

    component.formControl.setValue("ABC");
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

  function expectResultToHave(queryResults: any, result: Entity, done: DoneFn) {
    mockIndexService.queryIndexRaw.and.returnValue(
      Promise.resolve(queryResults)
    );

    subscription = component.results.subscribe((next) => {
      expect(next).toHaveSize(1);
      expect(next[0]).toHaveId(result.getId());
      expect(mockIndexService.queryIndexRaw).toHaveBeenCalled();
      done();
    });
  }

  function generateDemoData(): [Child, School, object] {
    const child1 = new Child("1");
    child1.name = "Adam X";
    const school1 = new School("s1");
    school1.name = "Anglo Primary";
    const mockQueryResults = {
      rows: [
        { id: child1.getId(true), doc: { name: child1.name }, key: "adam" },
        { id: child1.getId(true), doc: { name: child1.name }, key: "x" },
        { id: school1.getId(true), doc: { name: school1.name }, key: "anglo" },
        {
          id: school1.getId(true),
          doc: { name: school1.name },
          key: "primary",
        },
      ],
    };
    return [child1, school1, mockQueryResults];
  }

  it("should set results correctly for search input", (done) => {
    const [child1, , mockQueryResults] = generateDemoData();

    expectResultToHave(mockQueryResults, child1, done);
    component.formControl.setValue("Ada");
  });

  it("should not include duplicates in results", (done) => {
    const [child1, , mockQueryResults] = generateDemoData();

    expectResultToHave(mockQueryResults, child1, done);
    component.formControl.setValue("Ada");
  });

  it("should only include results matching all search terms (words)", (done) => {
    const [child1, , mockQueryResults] = generateDemoData();

    expectResultToHave(mockQueryResults, child1, done);
    component.formControl.setValue("A X");
  });
});
