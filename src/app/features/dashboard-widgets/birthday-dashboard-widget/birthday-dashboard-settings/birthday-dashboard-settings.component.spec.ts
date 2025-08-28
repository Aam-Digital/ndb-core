import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
  BirthdayDashboardSettingsComponent,
  BirthdayDashboardSettingsData,
} from "./birthday-dashboard-settings.component";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("BirthdayDashboardSettingsComponent", () => {
  let component: BirthdayDashboardSettingsComponent;
  let fixture: ComponentFixture<BirthdayDashboardSettingsComponent>;

  const mockData: BirthdayDashboardSettingsData = {
    entities: { Child: "dateOfBirth" },
    threshold: 32,
  };

  const mockEntityRegistry = {
    keys: () => ["Child", "User"],
    get: (entityType: string) => {
      const schemas = {
        Child: {
          schema: new Map([
            ["dateOfBirth", { dataType: "date-with-age" }],
            ["name", { dataType: "string" }],
          ]),
          isInternalEntity: false,
        },
        User: {
          schema: new Map([
            ["birthday", { dataType: "date" }],
            ["name", { dataType: "string" }],
          ]),
          isInternalEntity: false,
        },
      };
      return schemas[entityType];
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BirthdayDashboardSettingsComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: EntityRegistry, useValue: mockEntityRegistry },
        { provide: EntitySchemaService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BirthdayDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize with provided data", () => {
    expect(component.threshold.value).toBe(32);
    expect(component.entityProperties.length).toBe(1);

    const firstEntityProperty = component.entityProperties.at(0);
    expect(firstEntityProperty?.get("entityType")?.value).toBe("Child");
    expect(firstEntityProperty?.get("property")?.value).toBe("dateOfBirth");
  });

  it("should add new entity property", () => {
    const initialLength = component.entityProperties.length;
    component.addEntityProperty();

    expect(component.entityProperties.length).toBe(initialLength + 1);
  });

  it("should remove entity property", () => {
    component.addEntityProperty(); // Add one more
    const initialLength = component.entityProperties.length;

    component.removeEntityProperty(1);

    expect(component.entityProperties.length).toBe(initialLength - 1);
  });

  it("should get properties for entity type", () => {
    const childProperties = component.getPropertiesForEntity("Child");
    expect(childProperties).toContain("dateOfBirth");
    expect(childProperties).not.toContain("name"); // string datatype should be filtered out

    const userProperties = component.getPropertiesForEntity("User");
    expect(userProperties).toContain("birthday");
  });

  it("should generate correct output data", () => {
    component.threshold.setValue(45);

    // Add a second entity-property pair
    component.addEntityProperty();
    const secondControl = component.entityProperties.at(1);
    secondControl?.get("entityType")?.setValue("User");
    secondControl?.get("property")?.setValue("birthday");

    const outputData = component.getOutputData();

    expect(outputData.threshold).toBe(45);
    expect(outputData.entities).toEqual({
      Child: "dateOfBirth",
      User: "birthday",
    });
  });

  it("should reset property when entity type changes", () => {
    const control = component.entityProperties.at(0);
    control?.get("property")?.setValue("dateOfBirth");

    component.onEntityTypeChange(0, "User");

    expect(control?.get("property")?.value).toBe("");
  });
});
