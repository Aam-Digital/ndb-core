import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DiscreteImportConfigComponent } from "./discrete-import-config.component";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { ImportConfigDialogService } from "../../../import/import-column-mapping/import-config-dialog.service";
import { ColumnMapping } from "../../../import/column-mapping";

describe("DiscreteImportConfigComponent", () => {
  let component: DiscreteImportConfigComponent;
  let fixture: ComponentFixture<DiscreteImportConfigComponent>;
  let mockConfigDialogs: { openConfigDialog: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockConfigDialogs = {
      openConfigDialog: vi
        .fn()
        .mockImplementation((col: ColumnMapping) =>
          Promise.resolve({ ...col, additional: { values: { male: "M" } } }),
        ),
    };

    await TestBed.configureTestingModule({
      imports: [DiscreteImportConfigComponent],
      providers: [
        { provide: ImportConfigDialogService, useValue: mockConfigDialogs },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscreteImportConfigComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should mark the column as not configured while no value mappings exist", () => {
    fixture.componentRef.setInput("col", {
      column: "gender",
      propertyName: "category",
    });

    expect(component.badge()).toBe("?");
    expect(component.tooltip()).toContain("not mapped yet");
  });

  it("should show badge count and tooltip for unmapped values", () => {
    fixture.componentRef.setInput("col", {
      column: "gender",
      propertyName: "category",
      additional: { values: { male: "M", female: undefined } },
    });

    expect(component.badge()).toBe("1");
    expect(component.tooltip()).toContain("1");

    fixture.componentRef.setInput("col", {
      column: "gender",
      propertyName: "category",
      additional: { values: { male: "M" } },
    });

    expect(component.badge()).toBeUndefined();
    expect(component.tooltip()).toContain("All values");
  });

  it("should open dialog and notify with the configured mapping", async () => {
    const onChangeFn = vi.fn();
    const rawData = [{ gender: "male" }, { gender: "female" }];
    fixture.componentRef.setInput("col", {
      column: "gender",
      propertyName: "category",
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
      expect.objectContaining({ additional: { values: { male: "M" } } }),
    );
  });
});
