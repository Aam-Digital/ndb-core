import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SearchComponent } from "./search.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatToolbarModule } from "@angular/material/toolbar";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ChildrenModule } from "../../../child-dev-project/children/children.module";
import { SchoolsModule } from "../../../child-dev-project/schools/schools.module";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { RouterTestingModule } from "@angular/router/testing";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { EntityUtilsModule } from "../../entity-components/entity-utils/entity-utils.module";
import { Subscription } from "rxjs";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import {
  EntityRegistry,
  entityRegistry,
} from "../../entity/database-entity.decorator";

describe("SearchComponent", () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  let mockIndexService: jasmine.SpyObj<DatabaseIndexingService>;
  const entitySchemaService = new EntitySchemaService();
  let subscription: Subscription;

  beforeEach(
    waitForAsync(() => {
      mockIndexService = jasmine.createSpyObj("mockIndexService", [
        "queryIndexRaw",
        "createIndex",
      ]);

      TestBed.configureTestingModule({
        imports: [
          MatFormFieldModule,
          MatInputModule,
          MatAutocompleteModule,
          CommonModule,
          FormsModule,
          NoopAnimationsModule,
          ChildrenModule,
          SchoolsModule,
          MatToolbarModule,
          RouterTestingModule,
          ReactiveFormsModule,
          EntityUtilsModule,
        ],
        providers: [
          { provide: EntitySchemaService, useValue: entitySchemaService },
          { provide: DatabaseIndexingService, useValue: mockIndexService },
          { provide: EntityMapperService, useValue: {} },
          {
            provide: EntityRegistry,
            useValue: entityRegistry,
          },
        ],
        declarations: [SearchComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    mockIndexService.createIndex.and.returnValue(Promise.resolve());
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

  it("should not search for less than MIN_CHARACTERS_FOR_SEARCH character of input", (done) => {
    const tests = ["A", "AB"];
    let iteration = 0;
    subscription = component.results.subscribe((next) => {
      iteration++;
      expect(next).toBeEmpty();
      expect(mockIndexService.queryIndexRaw).not.toHaveBeenCalled();
      if (iteration === 2) {
        done();
      }
    });
    tests.forEach((t, index) => {
      setTimeout(() => component.formControl.setValue(t), 600 * index); // debounce
    });
  });

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
        { id: child1._id, doc: { name: child1.name }, key: "adam" },
        { id: child1._id, doc: { name: child1.name }, key: "x" },
        { id: school1._id, doc: { name: school1.name }, key: "anglo" },
        { id: school1._id, doc: { name: school1.name }, key: "primary" },
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
