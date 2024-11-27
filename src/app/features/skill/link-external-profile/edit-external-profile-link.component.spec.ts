import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EditExternalProfileLinkComponent } from "./edit-external-profile-link.component";
import { SkillApiService } from "../skill-api.service";
import { FormControl, FormGroup } from "@angular/forms";
import { Entity } from "../../../core/entity/model/entity";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { ExternalProfile } from "../external-profile";

describe("LinkExternalProfileComponent", () => {
  let component: EditExternalProfileLinkComponent;
  let fixture: ComponentFixture<EditExternalProfileLinkComponent>;

  let mockSkillApi: jasmine.SpyObj<SkillApiService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogResult: Subject<any>;
  let formControl: FormControl;
  let entity: Entity;

  beforeEach(async () => {
    formControl = new FormControl();
    entity = new TestEntity();

    mockSkillApi = jasmine.createSpyObj("SkillApiService", [
      "getExternalProfiles",
      "getExternalProfileById",
      "getSkillsFromExternalProfile",
    ]);

    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockDialogResult = new Subject<any>();
    mockDialog.open.and.returnValue({
      afterClosed: () => mockDialogResult.asObservable(),
    } as MatDialogRef<any>);

    await TestBed.configureTestingModule({
      imports: [EditExternalProfileLinkComponent],
      providers: [
        { provide: SkillApiService, useValue: mockSkillApi },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditExternalProfileLinkComponent);
    component = fixture.componentInstance;

    component.formControl = formControl;
    component.parent = new FormGroup({
      testField: formControl,
      skills: new FormControl(),
    });
    component.entity = entity;

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

  it("should empty value if user clicks 'unlink'", fakeAsync(() => {
    component.formControl.setValue("original-id");
    component.formControl.markAsPristine();

    component.unlinkExternalProfile();

    expect(component.formControl.value).toEqual(null);
    expect(component.formControl.dirty).toBeTrue();
  }));

  it("should update related form field from latest external entity if user clicks 'update data'", fakeAsync(() => {
    const mockSkills = [new TestEntity(), new TestEntity()] as any;
    mockSkillApi.getSkillsFromExternalProfile.and.resolveTo(mockSkills);
    component.formControl.setValue("external-id");

    component.updateExternalData();
    tick();

    expect(mockSkillApi.getSkillsFromExternalProfile).toHaveBeenCalledWith(
      "external-id",
    );
    // TODO: implement actual logic and configurable target field
    const targetFormControl = component.parent.get("skills");
    expect(targetFormControl.value).toEqual(mockSkills);
    expect(targetFormControl.dirty).toBeTrue();
  }));
});
