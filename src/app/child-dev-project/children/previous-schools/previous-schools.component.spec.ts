import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { PreviousSchoolsComponent } from "./previous-schools.component";
import { ChildrenService } from "../children.service";
import { ChildrenModule } from "../children.module";
import { SimpleChange } from "@angular/core";
import { Child } from "../model/child";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { ChildSchoolRelation } from "../model/childSchoolRelation";
import moment from "moment";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("PreviousSchoolsComponent", () => {
  let component: PreviousSchoolsComponent;
  let fixture: ComponentFixture<PreviousSchoolsComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  const testChild = new Child("22");

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj(["queryRelationsOf"]);
      mockChildrenService.queryRelationsOf.and.resolveTo([
        new ChildSchoolRelation(),
      ]);

      TestBed.configureTestingModule({
        imports: [
          ChildrenModule,
          MockedTestingModule.withState(),
          FontAwesomeTestingModule,
        ],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviousSchoolsComponent);
    component = fixture.componentInstance;
    component.child = testChild;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("it calls children service with id from passed child", fakeAsync(() => {
    component.ngOnChanges({
      child: new SimpleChange(undefined, testChild, false),
    });
    tick();
    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "child",
      testChild.getId(),
      false
    );
  }));

  it("should allow to change the columns to be displayed by the config", fakeAsync(() => {
    const config: PanelConfig = {
      entity: new Child(),
      config: {
        single: true,
        columns: [
          { id: "schoolId", label: "Team", view: "school" },
          { id: "start", label: "From", view: "date" },
          { id: "end", label: "To", view: "date" },
        ],
      },
    };
    component.onInitFromDynamicConfig(config);
    tick();

    let columnNames = component.columns.map((column) => column.label);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");
    expect(columnNames).not.toContain("Class");
    expect(columnNames).not.toContain("Result");

    config.config.columns.push(
      {
        id: "schoolClass",
        label: "Class",
        input: "text",
      },
      {
        id: "result",
        label: "Result",
        input: "percentageResult",
      }
    );

    component.onInitFromDynamicConfig(config);
    tick();

    columnNames = component.columns.map((column) => column.label);
    expect(columnNames).toEqual(
      jasmine.arrayContaining(["Team", "From", "To", "Class", "Result"])
    );
  }));

  it("should create new records with preset data", () => {
    const existingRelation = new ChildSchoolRelation();
    existingRelation.start = moment().subtract(1, "year").toDate();
    existingRelation.end = moment().subtract(1, "week").toDate();
    component.records = [existingRelation];
    const child = new Child();
    component.child = child;

    const newRelation = component.generateNewRecordFactory()();

    expect(newRelation.childId).toEqual(child.getId());
    expect(
      moment(existingRelation.end)
        .add(1, "day")
        .isSame(newRelation.start, "day")
    ).toBeTrue();
  });
});
