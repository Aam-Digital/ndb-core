import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditImportColumnMappingComponent } from "./edit-import-column-mapping.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ColumnMapping } from "../../column-mapping";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { ImportConfigDialogService } from "../import-config-dialog.service";

describe("EditImportColumnMappingComponent", () => {
  let component: EditImportColumnMappingComponent;
  let fixture: ComponentFixture<EditImportColumnMappingComponent>;
  let mockConfigDialogs: {
    hasConfigDialog: ReturnType<typeof vi.fn>;
    isConfigMissing: ReturnType<typeof vi.fn>;
    openConfigDialog: ReturnType<typeof vi.fn>;
  };

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
    mockConfigDialogs = {
      hasConfigDialog: vi.fn().mockReturnValue(true),
      isConfigMissing: vi.fn().mockReturnValue(true),
      openConfigDialog: vi
        .fn()
        .mockImplementation((col: ColumnMapping) =>
          Promise.resolve({ ...col, additional: { values: { male: "M" } } }),
        ),
    };

    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, EditImportColumnMappingComponent],
      providers: [
        { provide: ImportConfigDialogService, useValue: mockConfigDialogs },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditImportColumnMappingComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("columnMapping", columnMapping);
    fixture.componentRef.setInput("otherColumnMappings", []);
    fixture.componentRef.setInput("rawData", rawData);
    fixture.componentRef.setInput("entityCtor", TestEntity);
    fixture.detectChanges();

    vi.spyOn(component.columnMappingChange, "emit");
  });

  it("should emit changes after selected entity-field is changed", async () => {
    fixture.componentRef.setInput("columnMapping", { column: "name" });
    fixture.componentRef.setInput("entityCtor", TestEntity);
    fixture.detectChanges();

    component.updateMapping();

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ column: "name" }),
    );
  });

  it("should clear additional when updateMapping is called without settingAdditional flag", () => {
    fixture.componentRef.setInput("columnMapping", {
      column: "test",
      propertyName: "category",
      additional: "someValue",
    });
    fixture.detectChanges();

    component.updateMapping();

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ column: "test", propertyName: "category" }),
    );
    const emitted = (component.columnMappingChange.emit as any).mock
      .calls[0][0];
    expect(emitted.additional).toBeUndefined();
  });

  it("should emit the newly selected field without the previous transformation config", async () => {
    mockConfigDialogs.hasConfigDialog.mockReturnValue(false);
    fixture.componentRef.setInput("columnMapping", {
      column: "test",
      propertyName: "category",
      additional: { values: { male: "M" } },
    });
    fixture.detectChanges();

    await component.onFieldSelected("name");

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        column: "test",
        propertyName: "name",
        additional: undefined,
        manuallyUpdated: true,
      }),
    );
  });

  it("should open the config dialog of a newly selected field and emit its result", async () => {
    await component.onFieldSelected("category");

    expect(mockConfigDialogs.openConfigDialog).toHaveBeenCalledWith(
      expect.objectContaining({ propertyName: "category" }),
      rawData,
      TestEntity,
      undefined,
    );
    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ additional: { values: { male: "M" } } }),
    );
  });

  it("should open only one dialog if the field select notifies twice for one selection", async () => {
    await Promise.all([
      component.onFieldSelected("category"),
      component.onFieldSelected("category"),
    ]);

    expect(mockConfigDialogs.openConfigDialog).toHaveBeenCalledTimes(1);
  });

  it("should show an error while the value mapping config of the field is missing", () => {
    mockConfigDialogs.isConfigMissing.mockReturnValue(true);
    expect(component.configError()).toContain("not configured");

    mockConfigDialogs.isConfigMissing.mockReturnValue(false);
    fixture.componentRef.setInput("columnMapping", {
      ...columnMapping,
      additional: { values: { male: "M" } },
    });
    fixture.detectChanges();
    expect(component.configError()).toBeNull();
  });

  it("should preserve additional when updateMapping is called with settingAdditional=true", () => {
    fixture.componentRef.setInput("columnMapping", {
      column: "test",
      propertyName: "category",
      additional: "someValue",
    });
    fixture.detectChanges();

    component.updateMapping(true);

    expect(component.columnMappingChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        column: "test",
        propertyName: "category",
        additional: "someValue",
      }),
    );
  });
});
