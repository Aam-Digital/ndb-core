import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionMatrixComponent],
      providers: [{ provide: EntityRegistry, useValue: new EntityRegistry() }],
    }).compileComponents();

    TestBed.inject(FaIconLibrary).addIconPacks(fas);
    fixture = TestBed.createComponent(PermissionMatrixComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("model", model);
    fixture.detectChanges();
  });

  it("renders one row per subject with allowed and conditional cells marked", () => {
    const rows = fixture.nativeElement.querySelectorAll("tr[mat-row]");
    expect(rows.length).toBe(2);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain("Child");
    expect(text).toContain("All record types");

    const childRow = rows[0];
    expect(childRow.querySelectorAll(".allowed-icon").length).toBe(1);
    expect(childRow.querySelectorAll(".conditional-icon").length).toBe(1);
  });

  it("shows manage as checked checkbox and implies allowed for all actions of that row", () => {
    const rows = fixture.nativeElement.querySelectorAll("tr[mat-row]");
    const allRow = rows[1];

    const checkbox = allRow.querySelector("mat-checkbox input");
    expect(checkbox.checked).toBe(true);
    expect(allRow.querySelectorAll(".allowed-icon").length).toBe(4);
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
