import { ComponentFixture, TestBed } from "@angular/core/testing";

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

  let mockSkillApi: any;
  let mockDialog: any;
  let mockDialogResult: Subject<any>;
  let entity: Entity;

  beforeEach(async () => {
    entity = new TestEntity();

    mockSkillApi = {
      getExternalProfiles: vi
        .fn()
        .mockName("SkillApiService.getExternalProfiles"),
      getExternalProfileById: vi
        .fn()
        .mockName("SkillApiService.getExternalProfileById"),
      applyDataFromExternalProfile: vi
        .fn()
        .mockName("SkillApiService.applyDataFromExternalProfile"),
    };

    mockDialog = {
      open: vi.fn().mockName("MatDialog.open"),
    };
    mockDialogResult = new Subject<any>();
    mockDialog.open.mockReturnValue({
      afterClosed: () => mockDialogResult.asObservable(),
    } as MatDialogRef<any>);

    await TestBed.configureTestingModule({
      imports: [EditExternalProfileLinkComponent, FontAwesomeTestingModule],
      providers: [
        { provide: SkillApiService, useValue: mockSkillApi },
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: AlertService,
          useValue: {
            addWarning: vi.fn().mockName("AlertService.addWarning"),
          },
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

  it("should search external profiles and store externalId in form field", async () => {
    vi.useFakeTimers();
    try {
      const mockMatch: ExternalProfile = { id: "123" } as any;

      component.searchMatchingProfiles();
      mockDialogResult.next(mockMatch);
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(component.externalProfile).toEqual(mockMatch);
      expect(component.formControl.value).toEqual(mockMatch.id);
      expect(component.formControl.dirty).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not change value if dialog is aborted", async () => {
    vi.useFakeTimers();
    try {
      component.formControl.setValue("original-id");
      component.formControl.markAsPristine();

      component.searchMatchingProfiles();
      mockDialogResult.next(undefined);
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(component.formControl.value).toEqual("original-id");
      expect(component.formControl.dirty).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should pass the current state if edited form/entity to the search dialog", async () => {
    vi.useFakeTimers();
    try {
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
      await vi.advanceTimersByTimeAsync(0);

      const actualDialogData = vi.mocked(mockDialog.open).mock.lastCall[1]
        .data as LinkExternalProfileDialogData;
      expect(actualDialogData.config).toEqual(component.additional);

      expect(actualDialogData.entity["name"]).toBe("new name");
      expect(actualDialogData.entity["other"]).toBe("foo");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should empty value if user clicks 'unlink'", async () => {
    component.formControl.setValue("original-id");
    component.formControl.markAsPristine();

    component.unlinkExternalProfile();

    expect(component.formControl.value).toEqual(null);
    expect(component.formControl.dirty).toBe(true);
  });

  it("should load external profile during init, if already linked", async () => {
    vi.useFakeTimers();
    try {
      const mockProfile: ExternalProfile = { id: "external-id" } as any;
      component.formControl.setValue(mockProfile.id);
      mockSkillApi.getExternalProfileById.mockReturnValue(of(mockProfile));

      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockSkillApi.getExternalProfileById).toHaveBeenCalledWith(
        mockProfile.id,
      );
      expect(component.externalProfile).toEqual(mockProfile);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show warning if linked external profile cannot be loaded", async () => {
    vi.useFakeTimers();
    try {
      component.formControl.setValue("broken-id");
      mockSkillApi.getExternalProfileById.mockReturnValue(
        throwError(
          () => new HttpErrorResponse({ status: 504, statusText: "API error" }),
        ),
      );

      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(10000);

      expect(mockSkillApi.getExternalProfileById).toHaveBeenCalled();
      expect(component.externalProfile).toBeUndefined();
      expect(component.externalProfileError).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update external data", async () => {
    vi.useFakeTimers();
    try {
      mockSkillApi.applyDataFromExternalProfile.mockResolvedValue(undefined);
      component.formControl.setValue("external-id");

      component.updateExternalData();

      expect(component.isLoading()).toBe(true);
      await vi.advanceTimersByTimeAsync(0);

      expect(mockSkillApi.applyDataFromExternalProfile).toHaveBeenCalledWith(
        "external-id",
        component.additional,
        component.formControl.parent as FormGroup,
      );
      expect(component.isLoading()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
