import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ColumnMapping } from "../column-mapping";
import { ImportConfigDialogService } from "./import-config-dialog.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("ImportColumnMappingComponent", () => {
  let component: ImportColumnMappingComponent;
  let fixture: ComponentFixture<ImportColumnMappingComponent>;
  let mockConfigDialogs: {
    hasConfigDialog: ReturnType<typeof vi.fn>;
    openConfigDialog: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockConfigDialogs = {
      hasConfigDialog: vi
        .fn()
        .mockImplementation(
          (col: ColumnMapping) => col.propertyName === "category",
        ),
      openConfigDialog: vi.fn().mockImplementation((col: ColumnMapping) =>
        Promise.resolve({
          ...col,
          additional: { values: { male: "M" } },
          configReview: "confirmed",
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportColumnMappingComponent],
      providers: [
        { provide: ImportConfigDialogService, useValue: mockConfigDialogs },
      ],
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
      propertyName: "Test2",
    };

    fixture.componentRef.setInput("columnMapping", [originalColumnMapping]);
    fixture.detectChanges();

    component.updateColumnMapping(originalColumnMapping, newColumnMapping);

    expect(component.columnMapping()).toEqual([
      expect.objectContaining({
        column: "Name",
        propertyName: "Test2",
      }),
    ]);
  });

  it("should update the column mapping also if the row emitted an outdated object", () => {
    // e.g. a config dialog that was opened for the previous object of that column emits after it was replaced
    const outdatedColumnMapping: ColumnMapping = {
      column: "Name",
      propertyName: "test",
    };

    fixture.componentRef.setInput("columnMapping", [
      { ...outdatedColumnMapping },
    ]);
    fixture.detectChanges();

    component.updateColumnMapping(outdatedColumnMapping, {
      column: "Name",
      propertyName: "test",
      additional: "YYYY-MM-DD",
    });

    expect(component.columnMapping()).toEqual([
      expect.objectContaining({ column: "Name", additional: "YYYY-MM-DD" }),
    ]);
  });

  it("should open the config dialog of each newly mapped column that needs one and apply the result", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.componentRef.setInput("rawData", [{ gender: "male", name: "x" }]);
    fixture.componentRef.setInput("columnMapping", [
      { column: "name", propertyName: "name", manuallyUpdated: true },
      { column: "gender", propertyName: "category", manuallyUpdated: true },
      { column: "other", propertyName: "category", manuallyUpdated: true },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockConfigDialogs.openConfigDialog).toHaveBeenCalledTimes(2);
    expect(component.columnMapping()).toEqual([
      expect.objectContaining({ column: "name" }),
      expect.objectContaining({
        column: "gender",
        additional: { values: { male: "M" } },
      }),
      expect.objectContaining({
        column: "other",
        additional: { values: { male: "M" } },
      }),
    ]);
  });

  it("should not open dialogs for columns that were mapped automatically", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    // no manuallyUpdated flag: the column header matched the field, the user did not select it
    fixture.componentRef.setInput("columnMapping", [
      { column: "gender", propertyName: "category" },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockConfigDialogs.openConfigDialog).not.toHaveBeenCalled();
  });

  it("should not open the dialog again once its result was applied to the column", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.componentRef.setInput("columnMapping", [
      { column: "gender", propertyName: "category", manuallyUpdated: true },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    component.updateColumnMapping(component.columnMapping()[0], {
      ...component.columnMapping()[0],
      additional: undefined,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockConfigDialogs.openConfigDialog).toHaveBeenCalledTimes(1);
  });

  it("should open the dialog again when the column is mapped to a different field", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.componentRef.setInput("columnMapping", [
      { column: "gender", propertyName: "category", manuallyUpdated: true },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    mockConfigDialogs.hasConfigDialog.mockReturnValue(true);
    component.updateColumnMapping(component.columnMapping()[0], {
      column: "gender",
      propertyName: "dateOfBirth",
      manuallyUpdated: true,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockConfigDialogs.openConfigDialog).toHaveBeenCalledTimes(2);
  });
});
