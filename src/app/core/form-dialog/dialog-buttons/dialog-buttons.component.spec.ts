import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DialogButtonsComponent } from "./dialog-buttons.component";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { Entity } from "../../entity/model/entity";
import { MatDialogRef } from "@angular/material/dialog";
import { AlertService } from "../../alerts/alert.service";
import { Router } from "@angular/router";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FormGroup } from "@angular/forms";
import { firstValueFrom, Subject } from "rxjs";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EventEmitter } from "@angular/core";

describe("DialogButtonsComponent", () => {
  let component: DialogButtonsComponent<Entity>;
  let fixture: ComponentFixture<DialogButtonsComponent<Entity>>;
  let dialogRef: any;
  let backdropClick = new Subject<any>();
  let closed = new Subject<void>();

  beforeEach(waitForAsync(() => {
    dialogRef = {
      close: vi.fn(),
      backdropClick: vi.fn(),
      afterClosed: vi.fn(),
    };
    dialogRef.backdropClick.mockReturnValue(backdropClick);
    dialogRef.afterClosed.mockReturnValue(closed);
    TestBed.configureTestingModule({
      imports: [DialogButtonsComponent, MockedTestingModule.withState()],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogButtonsComponent);
    component = fixture.componentInstance;
    component.entity = new Entity();

    let mockEntityForm: EntityForm<any> = {
      formGroup: new FormGroup({}),
      onFormStateChange: new EventEmitter<"saved" | "cancelled">(),
      entity: new Entity(),
      fieldConfigs: [],
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };
    component.form = mockEntityForm;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should close the dialog when saving is successful", async () => {
    vi.useFakeTimers();
    try {
      const formService = TestBed.inject(EntityFormService);
      const result = new Entity();
      vi.spyOn(formService, "saveChanges").mockResolvedValue(result);
      const closeSpy = vi.fn();
      TestBed.inject(MatDialogRef).close = closeSpy;

      component.save();
      await vi.advanceTimersByTimeAsync(0);

      expect(closeSpy).toHaveBeenCalledWith(result);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show an alert when saving fails", async () => {
    vi.useFakeTimers();
    try {
      const formService = TestBed.inject(EntityFormService);
      const message = "Error message";
      vi.spyOn(formService, "saveChanges").mockRejectedValue(
        new Error(message),
      );
      const alertSpy = vi.fn();
      TestBed.inject(AlertService).addDanger = alertSpy;
      const closeSpy = vi.fn();
      TestBed.inject(MatDialogRef).close = closeSpy;

      component.save();
      await vi.advanceTimersByTimeAsync(0);

      expect(alertSpy).toHaveBeenCalledWith(message);
      expect(closeSpy).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not disable the form when creating a new entity", () => {
    expect(component.form.formGroup.disabled).toBeFalsy();
  });

  it("should create the details route", () => {
    const child = new TestEntity();
    child._rev = "existing";
    component.entity = child;
    TestBed.inject(Router).resetConfig([
      { path: "c/test-entity/:id", redirectTo: "/" },
    ]);

    component.ngOnInit();

    expect(component.detailsRoute).toBe(`/c/test-entity/${child.getId(true)}`);
  });

  it("should close the dialog if a entity is deleted", async () => {
    component.onAction("some other action");
    expect(dialogRef.close).not.toHaveBeenCalled();

    component.onAction("delete");
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it("should only close the dialog if user confirms to discard changes", async () => {
    vi.useFakeTimers();
    try {
      const confirmed = new Subject<boolean>();
      vi.spyOn(
        TestBed.inject(UnsavedChangesService),
        "checkUnsavedChanges",
      ).mockReturnValue(firstValueFrom(confirmed));

      backdropClick.next(undefined);
      await vi.advanceTimersByTimeAsync(0);

      expect(dialogRef.close).not.toHaveBeenCalled();

      confirmed.next(true);
      await vi.advanceTimersByTimeAsync(0);

      expect(dialogRef.close).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should reset pending changes when dialog is closed", () => {
    const unsavedChanges = TestBed.inject(UnsavedChangesService);
    unsavedChanges.pending = true;

    closed.next();

    expect(unsavedChanges.pending).toBe(false);
  });
});
