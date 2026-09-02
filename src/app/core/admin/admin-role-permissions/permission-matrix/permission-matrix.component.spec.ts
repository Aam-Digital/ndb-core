import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { provideRouter } from "@angular/router";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { of } from "rxjs";

import { PermissionMatrixComponent } from "./permission-matrix.component";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { Entity } from "../../../entity/model/entity";
import { MatrixModel } from "../permission-matrix";
import { mockConfirmationDialog } from "#src/app/utils/test-utils/dialog-mocks";

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
  const mockConfirmation = mockConfirmationDialog();

  // re-created per test, so a type registered by one test cannot leak into others
  let entityRegistry: EntityRegistry;

  beforeEach(async () => {
    vi.clearAllMocks();
    entityRegistry = new EntityRegistry();
    await TestBed.configureTestingModule({
      imports: [PermissionMatrixComponent],
      providers: [
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ConfirmationDialogService, useValue: mockConfirmation },
        provideRouter([]),
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
    expect(rows).toHaveLength(2);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain("Child");
    expect(text).toContain("All record types");

    const childRow = rows[0];
    // the "all" row of this role grants manage, so every action of the record
    // type is shown as already granted
    const checkedBoxes = childRow.querySelectorAll(
      "mat-checkbox.mat-mdc-checkbox-checked",
    );
    expect(checkedBoxes).toHaveLength(5);
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
    expect(boxes).toHaveLength(5);
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
    expect(emitted).toHaveLength(5);
  });

  it("adds a new row with read access only, including the all wildcard row", async () => {
    fixture.componentRef.setInput("model", {
      rows: [],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    await component.addSubject("all");

    // granting something for every record type is confirmed first
    expect(mockConfirmation.getConfirmation).toHaveBeenCalled();
    expect(emitted[0].rows).toEqual([
      { subject: "all", cells: { read: { allowed: true } } },
    ]);
  });

  it("drops the plain actions covered by manage, so removing manage clears the row", () => {
    fixture.componentRef.setInput("model", {
      rows: [
        {
          subject: "Child",
          cells: {
            read: { allowed: true },
            create: { allowed: true, conditions: { center: "x" } },
          },
        },
      ],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    component.setManage(0, true);

    // the plain "read" is implied by manage, the conditioned "create" is kept
    expect(emitted[0].rows[0].cells).toEqual({
      manage: { allowed: true },
      create: { allowed: true, conditions: { center: "x" } },
    });
  });

  it("keeps the rules of individual record types when the wildcard row grants manage", async () => {
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    // the fixture model holds a "Child" row and the "all" row at index 1
    component.setManage(1, true);

    expect(emitted[0].rows.map((r) => r.subject)).toEqual(["Child", "all"]);
    expect(emitted[0].rows[0].cells.read).toEqual({
      allowed: true,
      conditions: { center: "x" },
    });
  });

  it("locks only the actions a partial wildcard grants, leaving the rest editable per record type", () => {
    // the canonical case: a wildcard for read, plus additional actions
    // configured for individual record types
    fixture.componentRef.setInput("model", {
      rows: [
        { subject: "all", cells: { read: { allowed: true } } },
        { subject: "Child", cells: { manage: { allowed: true } } },
        { subject: "School", cells: { create: { allowed: true } } },
      ],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    fixture.detectChanges();

    const state = (rowIndex: number) =>
      Array.from(
        fixture.nativeElement
          .querySelectorAll("tr[mat-row]")
          [rowIndex].querySelectorAll("mat-checkbox"),
      ).map(
        (box: HTMLElement) =>
          (box.classList.contains("mat-mdc-checkbox-checked") ? "x" : "-") +
          (box.classList.contains("mat-mdc-checkbox-disabled") ? "!" : ""),
      );

    // read/create/update/delete/manage per row
    expect(state(0)).toEqual(["x", "-", "-", "-", "-"]);
    // covered by its own manage, which stays editable
    expect(state(1)).toEqual(["x!", "x!", "x!", "x!", "x"]);
    // read comes from the wildcard, the other actions can still be added here
    expect(state(2)).toEqual(["x!", "x", "-", "-", "-"]);
  });

  it("keeps the wildcard row editable when the default role only covers single record types", () => {
    fixture.componentRef.setInput("model", {
      rows: [{ subject: "all", cells: { read: { allowed: true } } }],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    fixture.componentRef.setInput("inheritedRules", [
      { subject: "SiteSettings", action: "read" },
    ]);
    fixture.detectChanges();

    const boxes = fixture.nativeElement
      .querySelectorAll("tr[mat-row]")[0]
      .querySelectorAll("mat-checkbox");
    boxes.forEach((box: HTMLElement) =>
      expect(box.classList).not.toContain("mat-mdc-checkbox-disabled"),
    );
  });

  it("lists the default role as a read-only row and locks what it grants", () => {
    fixture.componentRef.setInput("model", {
      rows: [{ subject: "Child", cells: {} }],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    fixture.componentRef.setInput("inheritedRules", [
      { subject: "all", action: "read" },
    ]);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll("tr[mat-row]");
    expect(rows[0].textContent).toContain("Default");

    // the default row itself is never editable
    const defaultBoxes = rows[0].querySelectorAll("mat-checkbox");
    expect(defaultBoxes[0].classList).toContain("mat-mdc-checkbox-checked");
    expect(defaultBoxes[0].classList).toContain("mat-mdc-checkbox-disabled");

    // the reason is also readable for screen readers, on the default row itself
    const defaultInput = rows[0].querySelector("mat-checkbox input");
    const describedBy = defaultInput.getAttribute("aria-describedby");
    expect(
      fixture.nativeElement.querySelector(`#${describedBy}`).textContent,
    ).toContain("every logged-in user");

    // what it grants is locked on the role's own rows, the rest stays editable
    const childBoxes = rows[1].querySelectorAll("mat-checkbox");
    expect(childBoxes[0].classList).toContain("mat-mdc-checkbox-checked");
    expect(childBoxes[0].classList).toContain("mat-mdc-checkbox-disabled");
    expect(childBoxes[1].classList).not.toContain("mat-mdc-checkbox-disabled");
  });

  it("does not lock a cell that the default role only grants conditionally", () => {
    fixture.componentRef.setInput("model", {
      rows: [{ subject: "Child", cells: {} }],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    // a conditional default rule only grants read for some records, so read
    // still has to be grantable outright for this role
    fixture.componentRef.setInput("inheritedRules", [
      { subject: "all", action: "read", conditions: { center: "x" } },
    ]);
    fixture.detectChanges();

    // nothing is granted to everyone, so no read-only "Default" row is shown
    const rows = fixture.nativeElement.querySelectorAll("tr[mat-row]");
    expect(rows).toHaveLength(1);

    const readBox = rows[0].querySelectorAll("mat-checkbox")[0];
    expect(readBox.classList).not.toContain("mat-mdc-checkbox-checked");
    expect(readBox.classList).not.toContain("mat-mdc-checkbox-disabled");
  });

  it("keeps a locked checkbox hoverable and describes the reason for screen readers", () => {
    fixture.componentRef.setInput("model", {
      rows: [{ subject: "Child", cells: { manage: { allowed: true } } }],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    fixture.detectChanges();

    const readInput = fixture.nativeElement.querySelector(
      "tr[mat-row] mat-checkbox input",
    );
    // disabled but still interactive, so the explaining tooltip can be reached
    expect(readInput.disabled).toBe(false);
    expect(readInput.getAttribute("aria-disabled")).toBe("true");

    const describedBy = readInput.getAttribute("aria-describedby");
    const description = fixture.nativeElement.querySelector(`#${describedBy}`);
    expect(description.textContent).toContain("Manage (all)");
  });

  it("always links to the _default role below the matrix", () => {
    const note = fixture.nativeElement.querySelector(".table-footer-note");
    expect(note.textContent).toContain("_default");
    expect(note.querySelector("a").getAttribute("href")).toBe(
      "/admin/user-roles/_default",
    );
  });

  it.each(["_default", "_public"])(
    "omits the inherited-permissions note on the reserved role %s",
    (roleName) => {
      fixture.componentRef.setInput("roleName", roleName);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelector(".table-footer-note"),
      ).toBeNull();
    },
  );

  it.each(["_default", "_public"])(
    "shows no inherited default permissions on the reserved role %s",
    (roleName) => {
      fixture.componentRef.setInput("model", {
        rows: [{ subject: "Child", cells: {} }],
        unsupportedRules: [],
      } satisfies MatrixModel);
      fixture.componentRef.setInput("editable", true);
      fixture.componentRef.setInput("roleName", roleName);
      // _public applies before login, where the _default rules never apply,
      // so nothing may be shown as already granted here
      fixture.componentRef.setInput("inheritedRules", [
        { subject: "all", action: "read" },
      ]);
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll("tr[mat-row]");
      expect(rows).toHaveLength(1);

      const childBoxes = rows[0].querySelectorAll("mat-checkbox");
      expect(childBoxes[0].classList).not.toContain("mat-mdc-checkbox-checked");
      expect(childBoxes[0].classList).not.toContain(
        "mat-mdc-checkbox-disabled",
      );
    },
  );

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
    expect(emitted).toHaveLength(2);

    // the shared close button closes with an empty string; this must be
    // treated as "cancel", not as removing the condition
    mockDialog.open.mockReturnValue({ afterClosed: () => of("") });
    component.openConditionDialog(0, "read");
    expect(emitted).toHaveLength(2);
  });

  it("keeps a cell's extra properties when its condition is edited via the dialog", () => {
    fixture.componentRef.setInput("model", {
      rows: [
        {
          subject: "Child",
          cells: {
            read: {
              allowed: true,
              conditions: { center: "x" },
              extra: { reason: "keep me" },
            },
          },
        },
      ],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.componentRef.setInput("editable", true);
    const emitted: MatrixModel[] = [];
    component.modelChange.subscribe((m) => emitted.push(m));

    mockDialog.open.mockReturnValue({ afterClosed: () => of({ center: "y" }) });
    component.openConditionDialog(0, "read");

    expect(emitted[0].rows[0].cells.read).toEqual({
      allowed: true,
      conditions: { center: "y" },
      extra: { reason: "keep me" },
    });
  });

  it("greys out internal system types and shows their key as a readable label", () => {
    class ConfigurableEnum extends Entity {
      static override readonly isInternalEntity = true;
    }
    entityRegistry.add("ConfigurableEnum", ConfigurableEnum);

    fixture.componentRef.setInput("model", {
      rows: [
        { subject: "ConfigurableEnum", cells: { read: { allowed: true } } },
      ],
      unsupportedRules: [],
    } satisfies MatrixModel);
    fixture.detectChanges();

    // internal types are greyed via the global "text-secondary" class and
    // carry the lock icon; their raw key is prettified to a readable label
    const subjectCell = fixture.nativeElement.querySelector(".text-secondary");
    expect(subjectCell).not.toBeNull();
    expect(subjectCell.querySelector(".internal-type-icon")).not.toBeNull();
    expect(subjectCell.textContent).toContain("Configurable Enum");
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
