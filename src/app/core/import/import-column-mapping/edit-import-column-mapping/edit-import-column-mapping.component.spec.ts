import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditImportColumnMappingComponent } from "./edit-import-column-mapping.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ColumnMapping } from "../../column-mapping";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("EditImportColumnMappingComponent", () => {
  let component: EditImportColumnMappingComponent;
  let fixture: ComponentFixture<EditImportColumnMappingComponent>;

  const columnMapping: ColumnMapping = {
    column: "test",
    propertyName: "category",
  };

  const rawData = [
    { name: "first", gender: "male" },
    { name: "second", gender: "female" },
    { name: "third", gender: "female" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, EditImportColumnMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditImportColumnMappingComponent);
    component = fixture.componentInstance;
    component.columnMapping = columnMapping;
    component.otherColumnMappings = [];
    component.rawData = rawData;
    component.entityCtor = TestEntity;
    fixture.detectChanges();

    vi.spyOn(component.columnMappingChange, "emit");
  });

  it("should emit changes after selected entity-field is changed", async () => {
    component.columnMapping = { column: "name" };
    component.entityCtor = TestEntity;

    component.updateMapping();

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ column: "name" }),
    );
  });

  it("should clear additional when updateMapping is called without settingAdditional flag", () => {
    component.columnMapping = {
      column: "test",
      propertyName: "category",
      additional: "someValue",
    };

    component.updateMapping();

    expect(component.columnMapping.additional).toBeUndefined();
    expect(component.columnMappingChange.emit).toHaveBeenCalled();
  });

  it("should preserve additional when updateMapping is called with settingAdditional=true", () => {
    component.columnMapping = {
      column: "test",
      propertyName: "category",
      additional: "someValue",
    };

    component.updateMapping(true);

    expect(component.columnMapping.additional).toBe("someValue");
    expect(component.columnMappingChange.emit).toHaveBeenCalled();
  });
});
