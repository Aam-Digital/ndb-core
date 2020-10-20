import { async, ComponentFixture, TestBed } from "@angular/core/testing";

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

describe("PreviousSchoolsComponent", () => {
  let component: PreviousSchoolsComponent;
  let fixture: ComponentFixture<PreviousSchoolsComponent>;

  const mockedSession = { getCurrentUser: () => "testUser" };
  const testChild = new Child("22");

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [RouterTestingModule, ChildrenModule, ConfirmationDialogModule],
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
  }));

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
});
