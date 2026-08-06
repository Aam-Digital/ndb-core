import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DateImportConfigComponent } from "./date-import-config.component";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { ImportConfigDialogService } from "../../../import/import-column-mapping/import-config-dialog.service";
import { ColumnMapping } from "../../../import/column-mapping";

describe("DateImportConfigComponent", () => {
  let component: DateImportConfigComponent;
  let fixture: ComponentFixture<DateImportConfigComponent>;
  let mockConfigDialogs: { openConfigDialog: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockConfigDialogs = {
      openConfigDialog: vi
        .fn()
        .mockImplementation((col: ColumnMapping) =>
          Promise.resolve({ ...col, additional: "YYYY-MM-DD" }),
        ),
    };

    await TestBed.configureTestingModule({
      imports: [DateImportConfigComponent],
      providers: [
        { provide: ImportConfigDialogService, useValue: mockConfigDialogs },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DateImportConfigComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should mark the column as not configured until a date format is set", () => {
    fixture.componentRef.setInput("col", {
      column: "date",
      propertyName: "dateOfBirth",
    });

    expect(component.badge()).toBe("?");
    expect(component.tooltip()).toContain("No date format");

    fixture.componentRef.setInput("col", {
      column: "date",
      propertyName: "dateOfBirth",
      additional: "DD.MM.YYYY",
    });

    expect(component.badge()).toBeUndefined();
    expect(component.tooltip()).toContain("DD.MM.YYYY");

    // confirming without a format is a valid config for dates the system reads on its own
    fixture.componentRef.setInput("col", {
      column: "date",
      propertyName: "dateOfBirth",
      additional: "",
    });

    expect(component.badge()).toBeUndefined();
    expect(component.tooltip()).toContain("without a format");
  });

  it("should open dialog and notify with the configured mapping", async () => {
    const onChangeFn = vi.fn();
    const rawData = [{ date: "2024-01-01" }, { date: "2024-02-01" }];
    fixture.componentRef.setInput("col", {
      column: "date",
      propertyName: "dateOfBirth",
    });
    fixture.componentRef.setInput("rawData", rawData);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("onColumnMappingChange", onChangeFn);

    await component.openConfig();

    expect(mockConfigDialogs.openConfigDialog).toHaveBeenCalledWith(
      component.col(),
      rawData,
      TestEntity,
      undefined,
    );
    expect(onChangeFn).toHaveBeenCalledWith(
      expect.objectContaining({ additional: "YYYY-MM-DD" }),
    );
  });
});
