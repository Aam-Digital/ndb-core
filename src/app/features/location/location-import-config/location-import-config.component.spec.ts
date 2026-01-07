import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {
  LocationImportConfig,
  LocationImportConfigComponent,
} from "./location-import-config.component";
import { MappingDialogData } from "../../../core/import/import-column-mapping/mapping-dialog-data";
import { ColumnMapping } from "../../../core/import/column-mapping";

describe("LocationImportConfigComponent", () => {
  let component: LocationImportConfigComponent;
  let fixture: ComponentFixture<LocationImportConfigComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;
  let mockDialogData: MappingDialogData;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);
    mockDialogData = {
      col: { column: "address" } as ColumnMapping,
      values: ["123 Main St", "456 Oak Ave"],
      entityType: undefined,
    };

    await TestBed.configureTestingModule({
      imports: [LocationImportConfigComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationImportConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize skipAddressLookup to false by default", () => {
    expect(component.skipAddressLookup.value).toBe(false);
  });

  it("should initialize skipAddressLookup from existing config", async () => {
    mockDialogData.col.additional = {
      skipAddressLookup: true,
    } as LocationImportConfig;

    fixture = TestBed.createComponent(LocationImportConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.skipAddressLookup.value).toBe(true);
  });

  it("should save config and close dialog", () => {
    component.skipAddressLookup.setValue(true);
    component.save();

    expect(mockDialogData.col.additional).toEqual({
      skipAddressLookup: true,
    } as LocationImportConfig);
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
