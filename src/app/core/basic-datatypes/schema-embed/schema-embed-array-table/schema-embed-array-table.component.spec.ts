import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MatDialog } from "@angular/material/dialog";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DisplayTextComponent } from "#src/app/core/basic-datatypes/string/display-text/display-text.component";
import { DisplayDateComponent } from "#src/app/core/basic-datatypes/date/display-date/display-date.component";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { SchemaEmbedArrayTableComponent } from "./schema-embed-array-table.component";
import {
  SchemaEmbedArrayEntryDialogComponent,
  SchemaEmbedArrayEntryDialogData,
} from "../schema-embed-array-entry-dialog/schema-embed-array-entry-dialog.component";

describe("SchemaEmbedArrayTableComponent", () => {
  let fixture: ComponentFixture<SchemaEmbedArrayTableComponent>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  const rows = [
    { documentType: "Passport", issueDate: new Date("2020-01-01") },
    { documentType: "ID Card", issueDate: new Date("2021-06-15") },
  ];

  beforeEach(async () => {
    mockDialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        SchemaEmbedArrayTableComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN),
      ],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaEmbedArrayTableComponent);
    fixture.componentRef.setInput("columns", [
      {
        id: "documentType",
        label: "Document Type",
        viewComponent: "DisplayText",
      },
      { id: "issueDate", label: "Issue Date", viewComponent: "DisplayDate" },
    ]);
    fixture.componentRef.setInput("rows", rows);
  });

  function headerTexts(): string[] {
    return fixture.debugElement
      .queryAll(By.css("th"))
      .map((h) => h.nativeElement.textContent.trim());
  }

  function tableRows(): HTMLElement[] {
    return fixture.debugElement
      .queryAll(By.css("tr.table-row"))
      .map((r) => r.nativeElement);
  }

  function lastDialogData(): SchemaEmbedArrayEntryDialogData {
    return mockDialog.open.mock.lastCall[1].data;
  }

  it("renders one column header per configured column, in order", () => {
    fixture.detectChanges();

    expect(headerTexts()).toEqual(["Document Type", "Issue Date"]);
  });

  it("renders one row per entry through each column's resolved view component", async () => {
    fixture.detectChanges();

    expect(tableRows()).toHaveLength(2);
    // cell view components are lazy-loaded, so they may not be rendered yet
    await vi.waitFor(() => {
      expect(
        fixture.debugElement.queryAll(By.directive(DisplayTextComponent)),
      ).toHaveLength(2);
      expect(
        fixture.debugElement.queryAll(By.directive(DisplayDateComponent)),
      ).toHaveLength(2);
    });
  });

  it("does not open any popup without applyChange", () => {
    fixture.detectChanges();

    tableRows()[0].click();

    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(fixture.debugElement.query(By.css("th button"))).toBeFalsy();
  });

  describe("with applyChange", () => {
    const applyChange = vi.fn();
    const entity = new TestEntity();

    beforeEach(() => {
      fixture.componentRef.setInput("applyChange", applyChange);
      fixture.componentRef.setInput("entity", entity);
    });

    it("opens the popup for the clicked entry", () => {
      fixture.detectChanges();

      tableRows()[1].click();

      expect(mockDialog.open.mock.lastCall[0]).toBe(
        SchemaEmbedArrayEntryDialogComponent,
      );
      expect(lastDialogData()).toEqual(
        expect.objectContaining({
          entries: rows,
          index: 1,
          entity,
          readonly: false,
          applyChange,
        }),
      );
      expect(lastDialogData().columns.map((c) => c.id)).toEqual([
        "documentType",
        "issueDate",
      ]);
    });

    it("opens the popup with all editColumns, also if not displayed", () => {
      fixture.componentRef.setInput("editColumns", [
        { id: "documentType" },
        { id: "issueDate" },
        { id: "hidden" },
      ]);
      fixture.detectChanges();

      tableRows()[0].click();

      expect(lastDialogData().columns.map((c) => c.id)).toEqual([
        "documentType",
        "issueDate",
        "hidden",
      ]);
    });

    it("opens the popup for a new entry when clicking the add button", () => {
      fixture.detectChanges();

      fixture.nativeElement.querySelector("th button").click();

      expect(lastDialogData().index).toBeUndefined();
    });

    it("opens the popup read-only and offers no add button if readonly", () => {
      fixture.componentRef.setInput("readonly", true);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css("th button"))).toBeFalsy();
      tableRows()[0].click();
      expect(lastDialogData().readonly).toBe(true);
    });
  });
});
