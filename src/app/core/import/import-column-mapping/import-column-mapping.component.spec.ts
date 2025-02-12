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

  it("it should emit columnMappingChange when updateColumnMapping is called", () => {
    const mockColumnMapping: ColumnMapping[] = [
      { column: "Name", propertyName: "test" },
      { column: "Age", propertyName: "age" },
    ];

    component.columnMapping = mockColumnMapping;
    spyOn(component.columnMappingChange, "emit");
    component.updateColumnMapping();

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      mockColumnMapping,
    );
  });
});
