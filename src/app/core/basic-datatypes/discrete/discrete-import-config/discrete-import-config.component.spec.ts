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
    component.col = { column: "gender", propertyName: "category" };

    expect(component.badge()).toBe("?");
  });

  it("should show badge count for unmapped values", () => {
    component.col = {
      column: "gender",
      propertyName: "category",
      additional: { values: { male: "M", female: undefined } },
    };

    expect(component.badge()).toBe("1");
  });

  it("should open dialog and notify on close", () => {
    component.col = { column: "gender", propertyName: "category" };
    component.rawData = [{ gender: "male" }, { gender: "female" }];
    component.entityType = TestEntity;
    component.onColumnMappingChange = vi.fn();

    component.openConfig();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.onColumnMappingChange).toHaveBeenCalledWith(component.col);
  });
});
