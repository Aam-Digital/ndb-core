import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { HttpErrorResponse } from "@angular/common/http";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { of, Subject, throwError } from "rxjs";
import { AlertService } from "../../../core/alerts/alert.service";
import { setupCustomFormControlEditComponent } from "../../../core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { Entity } from "../../../core/entity/model/entity";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ExternalProfile } from "../skill-api/external-profile";
import { SkillApiService } from "../skill-api/skill-api.service";
import { EditExternalProfileLinkComponent } from "./edit-external-profile-link.component";
import { LinkExternalProfileDialogData } from "./link-external-profile-dialog/link-external-profile-dialog.component";

describe("EditExternalProfileLinkComponent", () => {
  let component: EditExternalProfileLinkComponent;
  let fixture: ComponentFixture<EditExternalProfileLinkComponent>;
  let formGroup: FormGroup;

  let mockSkillApi: jasmine.SpyObj<SkillApiService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogResult: Subject<any>;
  let entity: Entity;

  beforeEach(async () => {
    entity = new TestEntity();

    mockSkillApi = jasmine.createSpyObj("SkillApiService", [
      "getExternalProfiles",
      "getExternalProfileById",
      "applyDataFromExternalProfile",
    ]);

    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockDialogResult = new Subject<any>();
    mockDialog.open.and.returnValue({
      afterClosed: () => mockDialogResult.asObservable(),
    } as MatDialogRef<any>);

    await TestBed.configureTestingModule({
      imports: [EditExternalProfileLinkComponent, FontAwesomeTestingModule],
      providers: [
        { provide: SkillApiService, useValue: mockSkillApi },
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: AlertService,
          useValue: jasmine.createSpyObj("AlertService", ["addWarning"]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditExternalProfileLinkComponent);
    component = fixture.componentInstance;
    component.entity = entity;

    formGroup = setupCustomFormControlEditComponent(component);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should search external profiles and store externalId in form field", fakeAsync(() => {
    const mockMatch: ExternalProfile = { id: "123" } as any;

    component.searchMatchingProfiles();
    mockDialogResult.next(mockMatch);
    tick();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.externalProfile).toEqual(mockMatch);
    expect(component.formControl.value).toEqual(mockMatch.id);
    expect(component.formControl.dirty).toBeTrue();
  }));

  it("should not change value if dialog is aborted", fakeAsync(() => {
    component.formControl.setValue("original-id");
    component.formControl.markAsPristine();

    component.searchMatchingProfiles();
    mockDialogResult.next(undefined);
    tick();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.formControl.value).toEqual("original-id");
    expect(component.formControl.dirty).toBeFalse();
  }));

  it("should pass the current state if edited form/entity to the search dialog", fakeAsync(() => {
    component.entity = TestEntity.create({
      name: "original name",
      other: "foo",
    });
    (component.formControl.parent as FormGroup).addControl(
      "name",
      new FormControl("name"),
    );
    (component.formControl.parent as FormGroup).addControl(
      "other",
      new FormControl("foo"),
    );

    component.formControl.parent.get("name").setValue("new name");

    component.searchMatchingProfiles();
    tick();

    const actualDialogData = mockDialog.open.calls.mostRecent().args[1]
      .data as LinkExternalProfileDialogData;
    expect(actualDialogData.config).toEqual(component.additional);

    expect(actualDialogData.entity["name"]).toBe("new name");
    expect(actualDialogData.entity["other"]).toBe("foo");
  }));

  it("should empty value if user clicks 'unlink'", fakeAsync(() => {
    component.formControl.setValue("original-id");
    component.formControl.markAsPristine();

    component.unlinkExternalProfile();

    expect(component.formControl.value).toEqual(null);
    expect(component.formControl.dirty).toBeTrue();
  }));

  it("should load external profile during init, if already linked", fakeAsync(() => {
    const mockProfile: ExternalProfile = { id: "external-id" } as any;
    component.formControl.setValue(mockProfile.id);
    mockSkillApi.getExternalProfileById.and.returnValue(of(mockProfile));

    component.ngOnInit();
    tick();

    expect(mockSkillApi.getExternalProfileById).toHaveBeenCalledWith(
      mockProfile.id,
    );
    expect(component.externalProfile).toEqual(mockProfile);
  }));

  it("should show warning if linked external profile cannot be loaded", fakeAsync(() => {
    component.formControl.setValue("broken-id");
    mockSkillApi.getExternalProfileById.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: 504, statusText: "API error" }),
      ),
    );

    component.ngOnInit();
    tick(10000);

    expect(mockSkillApi.getExternalProfileById).toHaveBeenCalled();
    expect(component.externalProfile).toBeUndefined();
    expect(component.externalProfileError).toBeTrue();
  }));

  it("should update external data", fakeAsync(() => {
    mockSkillApi.applyDataFromExternalProfile.and.resolveTo();
    component.formControl.setValue("external-id");

    component.updateExternalData();

    expect(component.isLoading()).toBeTrue();
    tick();

    expect(mockSkillApi.applyDataFromExternalProfile).toHaveBeenCalledWith(
      "external-id",
      component.additional,
      component.formControl.parent as FormGroup,
    );
    expect(component.isLoading()).toBeFalse();
  }));
});
