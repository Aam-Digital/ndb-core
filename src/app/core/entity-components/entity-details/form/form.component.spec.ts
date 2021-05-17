import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";
import { FormComponent } from "./form.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { BehaviorSubject } from "rxjs";
import { SafeUrl } from "@angular/platform-browser";
import { RouterTestingModule } from "@angular/router/testing";
import { Router } from "@angular/router";
import { EntityDetailsModule } from "../entity-details.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { SessionService } from "../../../session/session-service/session.service";
import { User } from "../../../user/user";
import { ChildPhotoService } from "../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { AlertService } from "../../../alerts/alert.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { ConfigService } from "../../../config/config.service";

describe("FormComponent", () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  const mockChildPhotoService: jasmine.SpyObj<ChildPhotoService> = jasmine.createSpyObj(
    "mockChildPhotoService",
    ["canSetImage", "setImage", "getImage"]
  );

  const mockSessionService: jasmine.SpyObj<SessionService> = jasmine.createSpyObj(
    "mockSessionService",
    { getCurrentUser: new User("test-user") }
  );
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  const testChild = new Child("Test Name");

  beforeEach(
    waitForAsync(() => {
      mockConfigService = jasmine.createSpyObj("mockConfigService", [
        "getConfig",
      ]);
      mockEntityMapper = jasmine.createSpyObj("mockEntityMapper", ["save"]);

      TestBed.configureTestingModule({
        declarations: [FormComponent],
        imports: [
          EntityDetailsModule,
          NoopAnimationsModule,
          RouterTestingModule,
        ],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: ChildPhotoService, useValue: mockChildPhotoService },
          { provide: SessionService, useValue: mockSessionService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compileComponents();
    })
  );

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
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.creatingNew = true;
    await component.save();
    expect(router.navigate).toHaveBeenCalledWith(["", testChild.getId()]);
  });

  it("sets a new child photo", async () => {
    const filename = "file/name";
    mockChildPhotoService.getImage.and.resolveTo(filename);
    testChild.photo = {
      path: "",
      photo: new BehaviorSubject<SafeUrl>("test"),
    };
    spyOn(testChild.photo.photo, "next");

    await component.uploadChildPhoto({ target: { files: [filename] } });

    expect(mockChildPhotoService.setImage).toHaveBeenCalledWith(
      filename,
      testChild.entityId
    );
    expect(testChild.photo.photo.next).toHaveBeenCalledWith(filename);
  });

  it("reports error when form is invalid", fakeAsync(() => {
    const alertService = fixture.debugElement.injector.get(AlertService);
    spyOn(alertService, "addDanger");

    spyOnProperty(component.form, "valid").and.returnValue(false);
    component.save();
    flush();

    expect(alertService.addDanger).toHaveBeenCalled();
  }));

  it("logs error when saving fails", fakeAsync(() => {
    const alertService = fixture.debugElement.injector.get(AlertService);
    spyOn(alertService, "addDanger");

    spyOnProperty(component.form, "valid").and.returnValue(true);
    mockEntityMapper.save.and.returnValue(Promise.reject("error"));

    component
      .save()
      .then(() => fail("expected error was not thrown"))
      .catch((err) => {
        expect(err.message).toEqual("error");
        expect(alertService.addDanger).toHaveBeenCalled();
      });

    flush();
  }));
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
