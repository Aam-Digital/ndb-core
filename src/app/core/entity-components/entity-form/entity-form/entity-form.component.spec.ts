import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EntityFormComponent } from "./entity-form.component";
import { ChildPhotoService } from "../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { ConfigService } from "../../../config/config.service";
import { AlertService } from "../../../alerts/alert.service";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { EntityFormModule } from "../entity-form.module";
import { EntityFormService } from "../entity-form.service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { AlertsModule } from "../../../alerts/alerts.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";

describe("EntityFormComponent", () => {
  let component: EntityFormComponent<Child>;
  let fixture: ComponentFixture<EntityFormComponent<Child>>;

  let mockChildPhotoService: jasmine.SpyObj<ChildPhotoService>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockConfirmation: jasmine.SpyObj<ConfirmationDialogService>;

  const testChild = new Child();

  beforeEach(waitForAsync(() => {
    mockChildPhotoService = jasmine.createSpyObj(["getImage"]);
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfirmation = jasmine.createSpyObj(["getConfirmation"]);

    TestBed.configureTestingModule({
      imports: [
        EntityFormModule,
        MockedTestingModule.withState(),
        MatSnackBarModule,
        AlertsModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: ChildPhotoService, useValue: mockChildPhotoService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ConfirmationDialogService, useValue: mockConfirmation },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    testChild.name = "Test Name";
    fixture = TestBed.createComponent(EntityFormComponent<Child>);
    component = fixture.componentInstance;
    component.entity = testChild;
    component.columns = [["name"]];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit notification when a child is saved", (done) => {
    spyOnProperty(component.form, "valid").and.returnValue(true);
    const subscription = component.save.subscribe((child) => {
      expect(child).toEqual(testChild);
      subscription.unsubscribe();
      done();
    });

    component.saveForm();
  });

  it("should show an alert when form service rejects saving", async () => {
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addDanger");
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.rejectWith(
      new Error("error message")
    );

    await component.saveForm();

    expect(alertService.addDanger).toHaveBeenCalledWith("error message");
  });

  it("should add column definitions from property schema", () => {
    class Test extends Child {
      @DatabaseField({ description: "Property description" })
      propertyField: string;
    }

    spyOn(TestBed.inject(EntitySchemaService), "getComponent").and.returnValue(
      "PredefinedComponent"
    );
    component.entity = new Test();
    component.columns = [
      [
        {
          id: "fieldWithDefinition",
          edit: "EditComponent",
          view: "DisplayComponent",
          label: "Field with definition",
          tooltip: "Custom tooltip",
        },
        { id: "propertyField", label: "Property" },
      ],
    ];

    component.ngOnInit();

    expect(component._columns).toEqual([
      [
        {
          id: "fieldWithDefinition",
          edit: "EditComponent",
          view: "DisplayComponent",
          label: "Field with definition",
          forTable: false,
          tooltip: "Custom tooltip",
        },
        {
          id: "propertyField",
          edit: "PredefinedComponent",
          view: "PredefinedComponent",
          label: "Property",
          forTable: false,
          tooltip: "Property description",
        },
      ],
    ]);
  });

  it("should overwrite form if user confirms it", async () => {
    mockConfirmation.getConfirmation.and.resolveTo(true);
    component.form.get("name").setValue("Other Name");
    component.form.markAsDirty();
    testChild.name = "Changed Name";

    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(testChild);

    expect(component.form.get("name")).toHaveValue("Changed Name");
    expect(mockConfirmation.getConfirmation).toHaveBeenCalled();
  });

  it("should not overwrite form if user declines it", async () => {
    mockConfirmation.getConfirmation.and.resolveTo(false);
    component.form.get("name").setValue("Other Name");
    component.form.markAsDirty();
    testChild.name = "Changed Name";

    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(testChild);

    expect(component.form.get("name")).toHaveValue("Other Name");
    expect(mockConfirmation.getConfirmation).toHaveBeenCalled();
  });

  it("should not overwrite form if it currently saves", async () => {
    component.form.get("name").setValue("Changed Name");

    await component.saveForm();

    expect(mockConfirmation.getConfirmation).not.toHaveBeenCalled();
    expect(component.entity.name).toBe("Changed Name");
    expect(component.form.get("name")).toHaveValue("Changed Name");
  });

  it("should align form with entity if canceled and notify about click", () => {
    const child = new Child();
    child.name = "test child";
    component.entity = child;
    component.form.enable();
    component.form.get("name").setValue("other name");
    let cancelEmitted = false;
    component.cancel.subscribe(() => (cancelEmitted = true));

    component.cancelClicked();

    expect(component.form.disabled).toBeTrue();
    expect(component.form.get("name")).toHaveValue("test child");
    expect(cancelEmitted).toBeTrue();
  });

  it("should also reset form values which where not set before", () => {
    component.entity = new Child();
    component.ngOnInit();
    component.form.enable();

    component.form.get("name").setValue("my name");
    component.cancelClicked();

    expect(component.form.get("name")).toHaveValue(null);
  });
});
