import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ColumnMapping } from "../column-mapping";

describe("ImportColumnMappingComponent", () => {
  let component: ImportColumnMappingComponent;
  let fixture: ComponentFixture<ImportColumnMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportColumnMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportColumnMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should update the original column mapping and emit columnMappingChange", () => {
    const originalColumnMapping: ColumnMapping = {
      column: "Name",
      propertyName: "test",
    };
    const newColumnMapping: ColumnMapping = {
      column: "Name",
      propertyName: "Tes2",
    };

    spyOn(component.columnMappingChange, "emit");

    component.updateColumnMapping(originalColumnMapping, newColumnMapping);

    expect(originalColumnMapping.propertyName).toBe("updatedTest");
    expect(component.columnMappingChange.emit).toHaveBeenCalledWith([
      ...component.columnMapping,
    ]);
  });
});
