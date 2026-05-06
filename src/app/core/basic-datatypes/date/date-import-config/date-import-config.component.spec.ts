import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DateImportConfigComponent } from "./date-import-config.component";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("DateImportConfigComponent", () => {
  let component: DateImportConfigComponent;
  let fixture: ComponentFixture<DateImportConfigComponent>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
    };

    await TestBed.configureTestingModule({
      imports: [DateImportConfigComponent],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(DateImportConfigComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open dialog and notify on close", () => {
    const onChangeFn = vi.fn();
    fixture.componentRef.setInput("col", {
      column: "date",
      propertyName: "dateOfBirth",
    });
    fixture.componentRef.setInput("rawData", [
      { date: "2024-01-01" },
      { date: "2024-02-01" },
    ]);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("onColumnMappingChange", onChangeFn);

    component.openConfig();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(onChangeFn).toHaveBeenCalledWith(component.col());
  });
});
