import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FormComponent } from "./form.component";
import { Router } from "@angular/router";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "../../alerts/alert.service";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import {
  KnownMultiTabCorruptionHandledError,
  MultiTabOperationBlockedError,
} from "#src/app/core/database/multi-tab-detection.service";

describe("FormComponent", () => {
  let component: FormComponent<TestEntity>;
  let fixture: ComponentFixture<FormComponent<TestEntity>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormComponent, MockedTestingModule.withState()],
      providers: [{ provide: ConfirmationDialogService, useValue: null }],
    }).compileComponents();
  }));

  beforeEach(async () => {
    vi.useFakeTimers();
    try {
      fixture = TestBed.createComponent(FormComponent<TestEntity>);
      component = fixture.componentInstance;
      component.entity = new TestEntity();
      component.fieldGroups = [{ fields: [{ id: "name" }] }];
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should change the creating state", () => {
    expect(component.creatingNew).toBe(false);

    component.entity = new TestEntity();
    component.fieldGroups = [];
    component.creatingNew = true;

    expect(component.creatingNew).toBe(true);
  });

  it("calls router once a new child is saved", async () => {
    const entityFormService = TestBed.inject(EntityFormService);
    vi.spyOn(entityFormService, "saveChanges").mockResolvedValue(undefined);

    const testChild = new TestEntity();
    const router = fixture.debugElement.injector.get(Router);
    vi.spyOn(router, "navigate");

    component.creatingNew = true;
    component.entity = testChild;
    await component.saveClicked();

    expect(entityFormService.saveChanges).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["", testChild.getId(true)]);
  });

  it("should show an alert when form service rejects saving", async () => {
    const alertService = TestBed.inject(AlertService);
    vi.spyOn(alertService, "addDanger");
    const entityFormService = TestBed.inject(EntityFormService);
    vi.spyOn(entityFormService, "saveChanges").mockRejectedValue(
      new Error("error message"),
    );

    await component.saveClicked();

    expect(alertService.addDanger).toHaveBeenCalledWith("error message");
  });

  it("should not show alert when known corruption is already handled by dialog", async () => {
    const alertService = TestBed.inject(AlertService);
    vi.spyOn(alertService, "addDanger");
    const entityFormService = TestBed.inject(EntityFormService);
    vi.spyOn(entityFormService, "saveChanges").mockRejectedValue(
      new KnownMultiTabCorruptionHandledError(),
    );

    await component.saveClicked();

    expect(alertService.addDanger).not.toHaveBeenCalled();
  });

  it("should not show alert when save is blocked due to multiple tabs", async () => {
    const alertService = TestBed.inject(AlertService);
    vi.spyOn(alertService, "addDanger");
    const entityFormService = TestBed.inject(EntityFormService);
    vi.spyOn(entityFormService, "saveChanges").mockRejectedValue(
      new MultiTabOperationBlockedError(),
    );

    await component.saveClicked();

    expect(alertService.addDanger).not.toHaveBeenCalled();
  });

  it("should align form with entity if canceled", () => {
    const child = new TestEntity();
    child.name = "test child";
    component.entity = child;
    component.form.formGroup.enable();
    component.form.formGroup.get("name").setValue("other name");

    component.cancelClicked();

    expect(component.form.formGroup.disabled).toBe(true);
    expect(component.form.formGroup.get("name").value).toEqual("test child");
  });

  it("should also reset form values which where not set before", () => {
    component.entity = new TestEntity();
    component.ngOnInit();
    component.form.formGroup.enable();

    component.form.formGroup.get("name").setValue("my name");
    component.cancelClicked();

    expect(component.form.formGroup.get("name").value).toBeUndefined();
  });
});
