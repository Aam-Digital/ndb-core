import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { PreviousSchoolsComponent } from "./previous-schools.component";
import { ChildrenService } from "../children/children.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildrenModule } from "../children/children.module";
import { RouterTestingModule } from "@angular/router/testing";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { SimpleChange } from "@angular/core";
import { Child } from "../children/model/child";
import { PanelConfig } from "../../core/entity-components/entity-details/EntityDetailsConfig";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import moment from "moment";
import { SessionService } from "../../core/session/session-service/session.service";
import { User } from "../../core/user/user";
import { mockEntityMapper } from "../../core/entity/mock-entity-mapper-service";

describe("PreviousSchoolsComponent", () => {
  let component: PreviousSchoolsComponent;
  let fixture: ComponentFixture<PreviousSchoolsComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  const testChild = new Child("22");

  beforeEach(
    waitForAsync(() => {
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue({
        name: "TestUser",
        roles: [],
      });
      mockChildrenService = jasmine.createSpyObj(["getSchoolRelationsFor"]);
      mockChildrenService.getSchoolRelationsFor.and.resolveTo([
        new ChildSchoolRelation(),
      ]);

      TestBed.configureTestingModule({
        declarations: [PreviousSchoolsComponent],
        imports: [
          RouterTestingModule,
          ChildrenModule,
          ConfirmationDialogModule,
        ],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
          {
            provide: EntityMapperService,
            useValue: mockEntityMapper([new User("TestUser")]),
          },
          { provide: SessionService, useValue: mockSessionService },
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
    expect(mockChildrenService.getSchoolRelationsFor).toHaveBeenCalledWith(
      testChild.getId()
    );
  }));

  it("should only show columns which are defined by the config", fakeAsync(() => {
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
    expect(component.columns).toHaveSize(3);
    let columnNames = component.columns.map((column) => column.label);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");

    config.config.columns.push({
      id: "schoolClass",
      label: "Class",
      input: "text",
    });
    config.config.columns.push({
      id: "result",
      label: "Result",
      input: "percentageResult",
    });

    component.onInitFromDynamicConfig(config);
    tick();
    expect(component.columns).toHaveSize(5);
    columnNames = component.columns.map((column) => column.label);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");
    expect(columnNames).toContain("Class");
    expect(columnNames).toContain("Result");
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
