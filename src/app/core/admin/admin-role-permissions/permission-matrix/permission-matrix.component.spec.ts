import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { of } from "rxjs";

import { PermissionMatrixComponent } from "./permission-matrix.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { MatrixModel } from "../permission-matrix";

describe("PermissionMatrixComponent", () => {
  let component: PermissionMatrixComponent;
  let fixture: ComponentFixture<PermissionMatrixComponent>;

  const model: MatrixModel = {
    rows: [
      {
        subject: "Child",
        cells: {
          read: { allowed: true, conditions: { center: "x" } },
          create: { allowed: true },
        },
      },
      { subject: "all", cells: { manage: { allowed: true } } },
    ],
    unsupportedRules: [],
  };

  const mockDialog = { open: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [PermissionMatrixComponent],
      providers: [
        { provide: EntityRegistry, useValue: new EntityRegistry() },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    TestBed.inject(FaIconLibrary).addIconPacks(fas);
    fixture = TestBed.createComponent(PermissionMatrixComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("model", model);
    fixture.detectChanges();
  });

  it("renders one row per subject and summarizes conditions as a readable chip", () => {
    const rows = fixture.nativeElement.querySelectorAll("tr[mat-row]");
    expect(rows.length).toBe(2);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain("Child");
    expect(text).toContain("All record types");

    const childRow = rows[0];
    // read and create are allowed (both rendered as checked, read carries a condition)
    const checkedBoxes = childRow.querySelectorAll(
      "mat-checkbox.mat-mdc-checkbox-checked",
    );
    expect(checkedBoxes.length).toBe(2);
    // the condition is shown as a readable chip next to its checkbox
    const chip = childRow.querySelector(".cell-condition-chip");
    expect(chip).not.toBeNull();
    expect(chip.textContent).toContain("center: x");
  });

  it("shows the wildcard all row as fully allowed via disabled checkboxes", () => {
    const rows = fixture.nativeElement.querySelectorAll("tr[mat-row]");
    const allRow = rows[1];

    const boxes = allRow.querySelectorAll("mat-checkbox");
    // 4 action columns + the manage column, all checked and disabled
    expect(boxes.length).toBe(5);
    boxes.forEach((box: HTMLElement) => {
      expect(box.classList).toContain("mat-mdc-checkbox-checked");
      expect(box.classList).toContain("mat-mdc-checkbox-disabled");
    });
  });

  it("supports cell toggle, manage toggle, row removal and adding subjects in editable mode", () => {
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    component.setCellAllowed(0, "update", true);
    expect(emitted[0].rows[0].cells.update).toEqual({ allowed: true });

    component.setCellAllowed(0, "read", false);
    expect(emitted[1].rows[0].cells.read).toBeUndefined();

    component.setManage(0, true);
    expect(emitted[2].rows[0].cells.manage).toEqual({ allowed: true });

    component.removeRow(1);
    expect(emitted[3].rows.map((r) => r.subject)).toEqual(["Child"]);

    component.addSubject("School");
    expect(emitted[4].rows.map((r) => r.subject)).toEqual([
      "Child",
      "all",
      "School",
    ]);
    expect(emitted[4].rows[2].cells.read).toEqual({ allowed: true });

    component.addSubject("Child");
    expect(emitted.length).toBe(5);
  });

  it("adds the all wildcard row with full manage access", () => {
    fixture.componentRef.setInput("model", {
      rows: [],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    component.addSubject("all");

    expect(emitted[0].rows).toEqual([
      { subject: "all", cells: { manage: { allowed: true } } },
    ]);
  });

  it("keeps the four actions independent and does not merge them into manage-all", () => {
    fixture.componentRef.setInput("model", {
      rows: [
        {
          subject: "Child",
          cells: {
            read: { allowed: true },
            create: { allowed: true },
            update: { allowed: true },
          },
        },
      ],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    component.setCellAllowed(0, "delete", true);

    // ticking all four must NOT switch on the broader "manage" wildcard
    const cells = emitted[0].rows[0].cells;
    expect(cells.manage).toBeUndefined();
    expect(cells.delete).toEqual({ allowed: true });
  });

  it("toggles manage as its own permission without touching the individual actions", () => {
    fixture.componentRef.setInput("model", {
      rows: [{ subject: "Child", cells: { read: { allowed: true } } }],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    component.setManage(0, true);

    expect(emitted[0].rows[0].cells.manage).toEqual({ allowed: true });
    expect(emitted[0].rows[0].cells.read).toEqual({ allowed: true });
  });

  it("applies dialog result as cell conditions and keeps cell allowed", () => {
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    mockDialog.open.mockReturnValue({
      afterClosed: () => of({ center: "x" }),
    });
    component.openConditionDialog(0, "create");
    expect(emitted[0].rows[0].cells.create).toEqual({
      allowed: true,
      conditions: { center: "x" },
    });

    mockDialog.open.mockReturnValue({ afterClosed: () => of(null) });
    component.openConditionDialog(0, "read");
    expect(emitted[1].rows[0].cells.read).toEqual({ allowed: true });

    mockDialog.open.mockReturnValue({ afterClosed: () => of(undefined) });
    component.openConditionDialog(0, "read");
    expect(emitted.length).toBe(2);

    // the shared close button closes with an empty string; this must be
    // treated as "cancel", not as removing the condition
    mockDialog.open.mockReturnValue({ afterClosed: () => of("") });
    component.openConditionDialog(0, "read");
    expect(emitted.length).toBe(2);
  });

  it("shows a hint when unsupported advanced rules exist", () => {
    fixture.componentRef.setInput("model", {
      rows: [],
      unsupportedRules: [
        { subject: "Child", action: "delete", inverted: true },
      ],
    } satisfies MatrixModel);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "only editable via JSON",
    );
  });
});
