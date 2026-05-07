import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LocationImportConfigComponent } from "./location-import-config.component";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ColumnMapping } from "../../../core/import/column-mapping";

describe("LocationImportConfigComponent", () => {
  let component: LocationImportConfigComponent;
  let fixture: ComponentFixture<LocationImportConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationImportConfigComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationImportConfigComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize skipLookup from column additional", () => {
    const col: ColumnMapping = {
      column: "address",
      propertyName: "address",
      additional: { skipAddressLookup: true },
    };
    fixture.componentRef.setInput("col", col);
    fixture.componentRef.setInput("rawData", [{ address: "Street 1" }]);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.detectChanges();

    expect(component.skipLookup()).toBe(true);
  });

  it("should update additional on toggle", () => {
    const col: ColumnMapping = {
      column: "address",
      propertyName: "address",
    };
    const onChangeFn = vi.fn();
    fixture.componentRef.setInput("col", col);
    fixture.componentRef.setInput("onColumnMappingChange", onChangeFn);
    fixture.detectChanges();

    component.onToggle(true);

    expect(onChangeFn).toHaveBeenCalledWith(
      expect.objectContaining({
        column: "address",
        propertyName: "address",
        additional: { skipAddressLookup: true },
      }),
    );

    // Simulate parent re-setting the input with the updated value
    const updatedCol = onChangeFn.mock.calls[0][0];
    fixture.componentRef.setInput("col", updatedCol);
    fixture.detectChanges();

    expect(component.skipLookup()).toBe(true);
  });
});
