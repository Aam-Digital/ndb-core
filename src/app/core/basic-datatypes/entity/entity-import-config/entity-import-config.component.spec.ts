import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityImportConfigComponent } from "./entity-import-config.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { ColumnMapping } from "../../../import/column-mapping";

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

    expect(component.referencedEntity()).not.toBeNull();
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
