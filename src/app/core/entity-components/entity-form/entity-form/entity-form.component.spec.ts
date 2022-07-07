import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EntityFormComponent } from "./entity-form.component";
import { ChildPhotoService } from "../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { Entity } from "../../../entity/model/entity";
import { ConfigService } from "../../../config/config.service";
import { AlertService } from "../../../alerts/alert.service";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { EntityFormModule } from "../entity-form.module";
import { EntityFormService } from "../entity-form.service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { AlertsModule } from "../../../alerts/alerts.module";
import { ReactiveFormsModule } from "@angular/forms";

describe("EntityFormComponent", () => {
  let component: EntityFormComponent;
  let fixture: ComponentFixture<EntityFormComponent>;

  let mockChildPhotoService: jasmine.SpyObj<ChildPhotoService>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  const testChild = new Child("Test Name");

  beforeEach(waitForAsync(() => {
    mockChildPhotoService = jasmine.createSpyObj(["getImage"]);
    mockConfigService = jasmine.createSpyObj(["getConfig"]);

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
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    testChild.name = "Test Name";
    fixture = TestBed.createComponent(EntityFormComponent);
    component = fixture.componentInstance;
    component.entity = testChild;
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

  it("should show an warning alert when form service rejects saving", async () => {
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addWarning");
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.rejectWith(
      new Error("error message")
    );

    await component.saveForm();

    expect(alertService.addWarning).toHaveBeenCalledWith("error message");
  });

  it("should add column definitions from property schema", () => {
    class Test extends Entity {
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
});
