import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { ImportConfigDialogService } from "./import-config-dialog.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ColumnMapping } from "../column-mapping";

describe("ImportConfigDialogService", () => {
  let service: ImportConfigDialogService;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
    };

    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    });

    service = TestBed.inject(ImportConfigDialogService);
  });

  it("should report a missing config only for fields that need one and have no additional yet", () => {
    const needsConfig: ColumnMapping = {
      column: "gender",
      propertyName: "category",
    };
    expect(service.isConfigMissing(needsConfig, TestEntity)).toBe(true);
    expect(
      service.isConfigMissing(
        { ...needsConfig, additional: { values: {} } },
        TestEntity,
      ),
    ).toBe(false);
    // an empty date format is a valid, confirmed config
    expect(
      service.isConfigMissing(
        { column: "date", propertyName: "dateOfBirth", additional: "" },
        TestEntity,
      ),
    ).toBe(false);
    expect(
      service.isConfigMissing(
        { column: "x", propertyName: "name" },
        TestEntity,
      ),
    ).toBe(false);
  });

  it("should detect which mapped fields have a config dialog", () => {
    expect(
      service.hasConfigDialog(
        { column: "gender", propertyName: "category" },
        TestEntity,
      ),
    ).toBe(true);
    expect(
      service.hasConfigDialog(
        { column: "name", propertyName: "name" },
        TestEntity,
      ),
    ).toBe(false);
    expect(service.hasConfigDialog({ column: "gender" }, TestEntity)).toBe(
      false,
    );
  });

  it("should open the dialog with the column's unique values and return the configured mapping", async () => {
    mockDialog.open.mockImplementation((_component, config) => {
      config.data.col.additional = { values: { male: "M" } };
      return { afterClosed: () => of(true) };
    });
    const col: ColumnMapping = { column: "gender", propertyName: "category" };

    const result = await service.openConfigDialog(
      col,
      [{ gender: "male" }, { gender: "female" }, { gender: "male" }],
      TestEntity,
    );

    const dialogData = mockDialog.open.mock.calls[0][1].data;
    expect(dialogData.values).toEqual(["male", "female"]);
    expect(dialogData.totalRowCount).toBe(3);
    expect(result.additional).toEqual({ values: { male: "M" } });
    // the given mapping is not modified, the dialog result is returned as a new object
    expect(col.additional).toBeUndefined();
  });

  it("should leave the mapping unconfigured when the user cancels the dialog", async () => {
    const col: ColumnMapping = { column: "gender", propertyName: "category" };

    const result = await service.openConfigDialog(col, [], TestEntity);

    expect(result.additional).toBeUndefined();
    expect(service.isConfigMissing(result, TestEntity)).toBe(true);
  });

  it("should not open a dialog for a field whose datatype does not define one", async () => {
    const col: ColumnMapping = { column: "name", propertyName: "name" };

    const result = await service.openConfigDialog(
      col,
      [{ name: "x" }],
      TestEntity,
    );

    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(result).toBe(col);
  });
});
