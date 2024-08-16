import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FormComponent } from "./form.component";
import { Router } from "@angular/router";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "../../alerts/alert.service";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("FormComponent", () => {
  let component: FormComponent<TestEntity>;
  let fixture: ComponentFixture<FormComponent<TestEntity>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormComponent, MockedTestingModule.withState()],
      providers: [{ provide: ConfirmationDialogService, useValue: null }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormComponent<TestEntity>);
    component = fixture.componentInstance;
    component.entity = new TestEntity();
    component.fieldGroups = [{ fields: [{ id: "name" }] }];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should change the creating state", () => {
    expect(component.creatingNew).toBeFalse();

    component.entity = new TestEntity();
    component.fieldGroups = [];
    component.creatingNew = true;

    expect(component.creatingNew).toBeTrue();
  });

  it("calls router once a new child is saved", async () => {
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.resolveTo();

    const testChild = new TestEntity();
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");

    component.creatingNew = true;
    component.entity = testChild;
    await component.saveClicked();

    expect(entityFormService.saveChanges).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["", testChild.getId(true)]);
  });

  it("should show an alert when form service rejects saving", async () => {
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addDanger");
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.rejectWith(
      new Error("error message"),
    );

    await component.saveClicked();

    expect(alertService.addDanger).toHaveBeenCalledWith("error message");
  });

  it("should align form with entity if canceled", () => {
    const child = new TestEntity();
    child.name = "test child";
    component.entity = child;
    component.form.enable();
    component.form.get("name").setValue("other name");

    component.cancelClicked();

    expect(component.form.disabled).toBeTrue();
    expect(component.form.get("name")).toHaveValue("test child");
  });

  it("should also reset form values which where not set before", () => {
    component.entity = new TestEntity();
    component.ngOnInit();
    component.form.enable();

    component.form.get("name").setValue("my name");
    component.cancelClicked();

    expect(component.form.get("name").value).toBeUndefined();
  });
});
