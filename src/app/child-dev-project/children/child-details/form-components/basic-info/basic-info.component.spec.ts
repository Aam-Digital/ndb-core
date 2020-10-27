import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BasicInfoComponent } from "./basic-info.component";
import { FormBuilder } from "@angular/forms";
import { EntityMapperService } from "../../../../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../../../../core/entity/schema/entity-schema.service";
import { Database } from "../../../../../core/database/database";
import { MockDatabase } from "../../../../../core/database/mock-database";
import { AlertService } from "../../../../../core/alerts/alert.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { ChildPhotoService } from "../../../child-photo-service/child-photo.service";
import { Router } from "@angular/router";
import { SessionService } from "../../../../../core/session/session-service/session.service";
import { User } from "../../../../../core/user/user";
import { EntitySubrecordModule } from "../../../../../core/entity-subrecord/entity-subrecord.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Child } from "../../../model/child";
import { SafeUrl } from "@angular/platform-browser";
import { BehaviorSubject } from "rxjs";

describe("BasicInfoComponent", () => {
  let component: BasicInfoComponent;
  let fixture: ComponentFixture<BasicInfoComponent>;

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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BasicInfoComponent],
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
    fixture = TestBed.createComponent(BasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should change the creating state", () => {
    expect(component.creatingNew).toBe(true);
    component.ngOnChanges({
      child: null,
    });
    fixture.detectChanges();
    expect(component.creatingNew).toBe(false);
  });

  it("changes enablePhotoUpload state", () => {
    expect(component.enablePhotoUpload).toBe(false);
    mockChildPhotoService.canSetImage.and.returnValues(true);
    component.switchEdit();
    expect(component.enablePhotoUpload).toBe(true);
  });

  it("calls router once a new child is saved", async () => {
    spyOnProperty(component.form, "valid").and.returnValue(true);
    const testChild = new Child("test-child");
    component.child = testChild;
    component.creatingNew = true;
    await component.save();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      "/child",
      testChild.getId(),
    ]);
  });

  it("sets a new child photo", async () => {
    const filename = "file/name";
    const testChild = new Child("test-child");

    // This needs to be set in order to create an spy on this property
    testChild.photo = new BehaviorSubject<SafeUrl>("test");

    mockChildPhotoService.getImage.and.returnValue(Promise.resolve(filename));
    spyOn(testChild.photo, "next");
    component.child = testChild;
    await component.uploadChildPhoto({ target: { files: [filename] } });
    expect(mockChildPhotoService.setImage).toHaveBeenCalledWith(
      filename,
      testChild.entityId
    );
    expect(testChild.photo.next).toHaveBeenCalledWith(filename);
  });

  // it("should create with edit mode", () => {
  //   mockChildPhotoService.canSetImage.and.returnValue(true);
  //   component.switchEdit();
  //
  //   fixture.detectChanges();
  //
  //   expect(component).toBeTruthy();
  // });
});
