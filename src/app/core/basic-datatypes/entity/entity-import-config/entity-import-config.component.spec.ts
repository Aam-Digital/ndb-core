import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityImportConfigComponent } from "./entity-import-config.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { ColumnMapping } from "../../../import/column-mapping";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { Entity } from "../../../entity/model/entity";

/** first allowed type of the multi-type field below, without a "startDate" field */
@DatabaseEntity("MultiRefTypeA")
class MultiRefTypeA extends Entity {
  static override label = "Type A";

  @DatabaseField({ label: "Name" }) name: string;
}

/** second allowed type, the only one declaring "startDate" */
@DatabaseEntity("MultiRefTypeB")
class MultiRefTypeB extends Entity {
  static override label = "Type B";

  @DatabaseField({ label: "Name" }) name: string;
  @DatabaseField({ label: "Start date", dataType: "date" }) startDate: Date;
}

@DatabaseEntity("MultiRefImportTarget")
class MultiRefImportTarget extends Entity {
  @DatabaseField({
    label: "Ref",
    dataType: "entity",
    additional: [MultiRefTypeA.ENTITY_TYPE, MultiRefTypeB.ENTITY_TYPE],
  })
  ref: string;
}

describe("EntityImportConfigComponent", () => {
  let component: EntityImportConfigComponent;
  let fixture: ComponentFixture<EntityImportConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityImportConfigComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityImportConfigComponent);
    component = fixture.componentInstance;
  });

  it("should initialize available properties from referenced entity", () => {
    const col: ColumnMapping = {
      column: "test",
      propertyName: "ref",
    };
    fixture.componentRef.setInput("col", col);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("otherColumnMappings", []);
    fixture.detectChanges();

    expect(component.referencedEntities()).not.toHaveLength(0);
    expect(component.availableProperties().length).toBeGreaterThan(0);
  });

  it("should update additional when ref field changes", () => {
    const col: ColumnMapping = {
      column: "test",
      propertyName: "ref",
    };
    const onChangeFn = vi.fn();
    fixture.componentRef.setInput("col", col);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("otherColumnMappings", []);
    fixture.componentRef.setInput("onColumnMappingChange", onChangeFn);
    fixture.detectChanges();

    component.onRefFieldChange("name");

    expect(onChangeFn).toHaveBeenCalledWith(
      expect.objectContaining({
        column: "test",
        propertyName: "ref",
        additional: expect.objectContaining({ refField: "name" }),
      }),
    );

    // Simulate parent re-setting the input with the updated value
    const updatedCol = onChangeFn.mock.calls[0][0];
    fixture.componentRef.setInput("col", updatedCol);
    fixture.detectChanges();

    expect(component.selectedRefField()).toBe("name");
  });

  it("should name the declaring types for each property of a multi-type reference field", () => {
    const col: ColumnMapping = { column: "test", propertyName: "ref" };
    fixture.componentRef.setInput("col", col);
    fixture.componentRef.setInput("entityType", MultiRefImportTarget);
    fixture.componentRef.setInput("otherColumnMappings", []);
    fixture.detectChanges();

    const properties = component.availableProperties();
    const sharedProperty = properties.find((p) => p.property === "name");
    const typeBOnlyProperty = properties.find(
      (p) => p.property === "startDate",
    );

    // "name" exists on both types, so the collapsed entry names both
    expect(sharedProperty.typeHint).toContain(MultiRefTypeA.label);
    expect(sharedProperty.typeHint).toContain(MultiRefTypeB.label);
    expect(typeBOnlyProperty.typeHint).toBe(MultiRefTypeB.label);
  });

  it("should not add a type hint when the field allows only a single type", () => {
    const col: ColumnMapping = { column: "test", propertyName: "ref" };
    fixture.componentRef.setInput("col", col);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("otherColumnMappings", []);
    fixture.detectChanges();

    expect(
      component.availableProperties().every((p) => !p.typeHint),
    ).toBeTruthy();
  });

  it("should resolve the sub-field config from whichever allowed type declares the selected property", () => {
    const col: ColumnMapping = {
      column: "test",
      propertyName: "ref",
      // "startDate" only exists on the second allowed type
      additional: { refField: "startDate" },
    };
    fixture.componentRef.setInput("col", col);
    fixture.componentRef.setInput("entityType", MultiRefImportTarget);
    fixture.componentRef.setInput("otherColumnMappings", []);
    fixture.detectChanges();

    const subFieldConfig = component.subFieldInlineConfig();

    expect(subFieldConfig).not.toBeNull();
    expect(subFieldConfig.config.entityType).toBe(MultiRefTypeB);
  });

  it("should not throw and should offer properties from every allowed type for a multi-type reference field", () => {
    const col: ColumnMapping = {
      column: "test",
      propertyName: "refMixed",
    };
    fixture.componentRef.setInput("col", col);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("otherColumnMappings", []);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.availableProperties().length).toBeGreaterThan(0);
  });
});
