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
    component.col = col;
    component.rawData = [{ address: "Street 1" }];
    component.entityType = TestEntity;
    component.ngOnChanges({ col: {} as any });

    expect(component.skipLookup()).toBe(true);
  });

  it("should update additional on toggle", () => {
    const col: ColumnMapping = {
      column: "address",
      propertyName: "address",
    };
    component.col = col;
    component.onColumnMappingChange = vi.fn();

    component.onToggle(true);

    expect(component.skipLookup()).toBe(true);
    expect(col.additional).toEqual({ skipAddressLookup: true });
    expect(component.onColumnMappingChange).toHaveBeenCalledWith(col);
  });
});
