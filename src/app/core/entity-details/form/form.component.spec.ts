import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FormComponent } from "./form.component";
import { Child } from "../../../child-dev-project/children/model/child";
import { Router } from "@angular/router";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "../../alerts/alert.service";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { DatabaseField } from "../../entity/database-field.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

describe("FormComponent", () => {
  let component: FormComponent<Child>;
  let fixture: ComponentFixture<FormComponent<Child>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormComponent, MockedTestingModule.withState()],
      providers: [{ provide: ConfirmationDialogService, useValue: null }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormComponent<Child>);
    component = fixture.componentInstance;
    component.entity = new Child();
    component.cols = [[{ id: "name" }]];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should change the creating state", () => {
    expect(component.creatingNew).toBeFalse();

    component.entity = new Child();
    component.cols = [];
    component.creatingNew = true;

    expect(component.creatingNew).toBeTrue();
  });

  it("calls router once a new child is saved", async () => {
    const testChild = new Child();
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.creatingNew = true;
    component.entity = testChild;
    await component.saveClicked();
    expect(router.navigate).toHaveBeenCalledWith(["", testChild.getId()]);
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
    const child = new Child();
    child.name = "test child";
    component.entity = child;
    component.form.enable();
    component.form.get("name").setValue("other name");

    component.cancelClicked();

    expect(component.form.disabled).toBeTrue();
    expect(component.form.get("name")).toHaveValue("test child");
  });

  it("should also reset form values which where not set before", () => {
    component.entity = new Child();
    component.ngOnInit();
    component.form.enable();

    component.form.get("name").setValue("my name");
    component.cancelClicked();

    expect(component.form.get("name")).toHaveValue(null);
  });

  it("should add column definitions from property schema", () => {
    class Test extends Child {
      @DatabaseField({
        description: "Property description",
        additional: "someAdditional",
      })
      propertyField: string;
    }

    spyOn(TestBed.inject(EntitySchemaService), "getComponent").and.returnValue(
      "PredefinedComponent",
    );
    component.entity = new Test();
    component.cols = [
      [
        {
          id: "fieldWithDefinition",
          edit: "EditComponent",
          view: "DisplayComponent",
          label: "Field with definition",
          tooltip: "Custom tooltip",
          additional: "additional",
        },
        { id: "propertyField", label: "Property" },
      ],
    ];

    component.ngOnInit();

    expect(component._cols).toEqual([
      [
        {
          id: "fieldWithDefinition",
          edit: "EditComponent",
          view: "DisplayComponent",
          label: "Field with definition",
          forTable: false,
          tooltip: "Custom tooltip",
          additional: "additional",
        },
        {
          id: "propertyField",
          edit: "PredefinedComponent",
          view: "PredefinedComponent",
          label: "Property",
          forTable: false,
          tooltip: "Property description",
          additional: "someAdditional",
        },
      ],
    ]);
  });
});
