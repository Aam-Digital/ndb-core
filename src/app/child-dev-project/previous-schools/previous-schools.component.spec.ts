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
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { MockDatabase } from "../../core/database/mock-database";
import { AlertService } from "../../core/alerts/alert.service";
import { Database } from "../../core/database/database";
import { ChildrenModule } from "../children/children.module";
import { RouterTestingModule } from "@angular/router/testing";
import { SchoolsService } from "../schools/schools.service";
import { SessionService } from "../../core/session/session-service/session.service";
import { ChildPhotoService } from "../children/child-photo-service/child-photo.service";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { SimpleChange } from "@angular/core";
import { Child } from "../children/model/child";
import { PanelConfig } from "../../core/entity-components/entity-details/EntityDetailsConfig";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import moment from "moment";

describe("PreviousSchoolsComponent", () => {
  let component: PreviousSchoolsComponent;
  let fixture: ComponentFixture<PreviousSchoolsComponent>;

  const mockedSession = { getCurrentUser: () => "testUser" };
  const testChild = new Child("22");

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [],
        imports: [
          RouterTestingModule,
          ChildrenModule,
          ConfirmationDialogModule,
        ],
        providers: [
          { provide: Database, useClass: MockDatabase },
          { provide: SessionService, useValue: mockedSession },
          EntityMapperService,
          EntitySchemaService,
          AlertService,
          SchoolsService,
          {
            provide: ChildPhotoService,
            useValue: jasmine.createSpyObj(["getImage"]),
          },
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

  it("it calls children service with id from passed child", (done) => {
    const childrenService = fixture.debugElement.injector.get(ChildrenService);
    spyOn(component, "loadData").and.callThrough();
    spyOn(childrenService, "getSchoolsWithRelations").and.callThrough();

    component.ngOnChanges({
      child: new SimpleChange(undefined, testChild, false),
    });

    fixture.whenStable().then(() => {
      expect(component.loadData).toHaveBeenCalledWith(testChild.getId());
      expect(childrenService.getSchoolsWithRelations).toHaveBeenCalledWith(
        testChild.getId()
      );
      done();
    });
  });

  it("should only show columns which are defined by the config", fakeAsync(() => {
    const config: PanelConfig = {
      entity: new Child(),
      config: {
        single: true,
        columns: [
          { id: "schoolId", label: "Team", input: "school" },
          { id: "start", label: "From", input: "date" },
          { id: "end", label: "To", input: "date" },
        ],
      },
    };
    component.onInitFromDynamicConfig(config);
    component.ngOnInit();
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
    component.ngOnInit();
    tick();
    expect(component.columns).toHaveSize(5);
    columnNames = component.columns.map((column) => column.label);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");
    expect(columnNames).toContain("Class");
    expect(columnNames).toContain("Result");
  }));

  it("should display errors for invalid fields", () => {
    const entry = new ChildSchoolRelation();
    let validation = component.formValidation(entry);
    expect(validation.hasPassedValidation).toBeFalse();

    entry.schoolId = "test school";
    entry.start = new Date();
    entry.end = moment().subtract(1, "week").toDate();
    validation = component.formValidation(entry);
    expect(validation.hasPassedValidation).toBeFalse();

    entry.end = moment().add(1, "week").toDate();
    entry.result = 200;
    validation = component.formValidation(entry);
    expect(validation.hasPassedValidation).toBeFalse();

    entry.result = 75;
    validation = component.formValidation(entry);
    expect(validation.hasPassedValidation).toBeTrue();
  });
});
