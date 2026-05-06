import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DiscreteImportConfigComponent } from "./discrete-import-config.component";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("DiscreteImportConfigComponent", () => {
  let component: DiscreteImportConfigComponent;
  let fixture: ComponentFixture<DiscreteImportConfigComponent>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
    };

    await TestBed.configureTestingModule({
      imports: [DiscreteImportConfigComponent],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscreteImportConfigComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show badge with ? when no value mappings exist", () => {
    fixture.componentRef.setInput("col", {
      column: "gender",
      propertyName: "category",
    });

    expect(component.badge()).toBe("?");
  });

  it("should show badge count for unmapped values", () => {
    fixture.componentRef.setInput("col", {
      column: "gender",
      propertyName: "category",
      additional: { values: { male: "M", female: undefined } },
    });

    expect(component.badge()).toBe("1");
  });

  it("should open dialog and notify on close", () => {
    const onChangeFn = vi.fn();
    fixture.componentRef.setInput("col", {
      column: "gender",
      propertyName: "category",
    });
    fixture.componentRef.setInput("rawData", [
      { gender: "male" },
      { gender: "female" },
    ]);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("onColumnMappingChange", onChangeFn);

    component.openConfig();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(onChangeFn).toHaveBeenCalledWith(component.col());
  });
});
