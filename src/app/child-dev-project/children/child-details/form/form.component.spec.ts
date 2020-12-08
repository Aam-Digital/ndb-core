import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { FormComponent } from "./form.component";
import { ChildPhotoService } from "../../child-photo-service/child-photo.service";
import { Router } from "@angular/router";
import { SessionService } from "../../../../core/session/session-service/session.service";
import { User } from "../../../../core/user/user";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { EntitySubrecordModule } from "../../../../core/entity-subrecord/entity-subrecord.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Database } from "../../../../core/database/database";
import { MockDatabase } from "../../../../core/database/mock-database";
import { FormBuilder } from "@angular/forms";
import { AlertService } from "../../../../core/alerts/alert.service";
import { Child } from "../../model/child";
import { BehaviorSubject } from "rxjs";
import { SafeUrl } from "@angular/platform-browser";

describe("FormComponent", () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  const mockChildPhotoService: jasmine.SpyObj<ChildPhotoService> = jasmine.createSpyObj(
    "mockChildPhotoService",
    ["canSetImage", "setImage", "getImage"]
  );

  const mockRouter: jasmine.SpyObj<Router> = jasmine.createSpyObj(
    "mockRouter",
    ["navigate"]
  );

  const mockSessionService: jasmine.SpyObj<SessionService> = jasmine.createSpyObj(
    "mockSessionService",
    { getCurrentUser: new User("test-user") }
  );

  const testChild = new Child("Test Name");

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormComponent],
      imports: [MatSnackBarModule, EntitySubrecordModule, NoopAnimationsModule],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase },
        FormBuilder,
        AlertService,
        { provide: ChildPhotoService, useValue: mockChildPhotoService },
        { provide: Router, useValue: mockRouter },
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    testChild.name = "Test Name";
    mockChildPhotoService.canSetImage.and.returnValue(false);
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({
      entity: testChild,
      config: testConfig,
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should change the creating state", () => {
    expect(component.creatingNew).toBe(false);
    component.onInitFromDynamicConfig({
      entity: testChild,
      config: testConfig,
      creatingNew: true,
    });
    expect(component.creatingNew).toBe(true);
  });

  it("changes enablePhotoUpload state", () => {
    expect(component.enablePhotoUpload).toBe(false);
    mockChildPhotoService.canSetImage.and.returnValues(true);
    component.switchEdit();
    expect(component.enablePhotoUpload).toBe(true);
  });

  it("calls router once a new child is saved", async () => {
    spyOnProperty(component.form, "valid").and.returnValue(true);
    component.creatingNew = true;
    await component.save();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      "/child",
      testChild.getId(),
    ]);
  });

  it("sets a new child photo", async () => {
    const filename = "file/name";

    // This needs to be set in order to create an spy on this property
    testChild.photo = new BehaviorSubject<SafeUrl>("test");

    mockChildPhotoService.getImage.and.returnValue(Promise.resolve(filename));
    spyOn(testChild.photo, "next");
    await component.uploadChildPhoto({ target: { files: [filename] } });
    expect(mockChildPhotoService.setImage).toHaveBeenCalledWith(
      filename,
      testChild.entityId
    );
    expect(testChild.photo.next).toHaveBeenCalledWith(filename);
  });

  it("reports error when form is invalid", (done) => {
    const alertService = fixture.debugElement.injector.get(AlertService);
    spyOn(alertService, "addDanger");
    spyOnProperty(component.form, "valid").and.returnValue(false);
    component
      .save()
      .then(() => fail())
      .catch((err) => {
        expect(err).toBeDefined();
        expect(alertService.addDanger).toHaveBeenCalled();
        done();
      });
  });

  it("logs error when saving fails", (done) => {
    spyOnProperty(component.form, "valid").and.returnValue(true);
    spyOn(
      fixture.debugElement.injector.get(EntityMapperService),
      "save"
    ).and.returnValue(Promise.reject("error"));
    const alertService = fixture.debugElement.injector.get(AlertService);
    spyOn(alertService, "addDanger");
    component
      .save()
      .then(() => fail())
      .catch((err) => {
        expect(err.message).toEqual("error");
        expect(alertService.addDanger).toHaveBeenCalled();
        done();
      });
  });
});

export const testConfig = {
  cols: [
    [
      {
        input: "text",
        id: "name",
        placeholder: "Name",
        required: true,
      },
      {
        input: "select",
        id: "health_vaccinationStatus",
        placeholder: "Peter Status",
        options: [
          "Good",
          "Vaccination Due",
          "Needs Checking",
          "No Card/Information",
        ],
      },
    ],
    [
      {
        input: "select",
        id: "health_eyeHealthStatus",
        placeholder: "Eye Status",
        options: ["Good", "Has Glasses", "Needs Glasses", "Needs Checkup"],
      },
    ],
    [
      {
        input: "text",
        id: "health_bloodGroup",
        placeholder: "Blood Group",
      },
    ],
    [
      {
        input: "datepicker",
        id: "health_lastDentalCheckup",
        placeholder: "Last Dental Check-Up",
      },
    ],
  ],
};
