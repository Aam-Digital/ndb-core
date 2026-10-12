import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EmbeddedArrayDataComponent } from "./embedded-array-data.component";
import {
  EmbeddedArrayEntryDialogComponent,
  EmbeddedArrayEntryDialogData,
} from "./embedded-array-entry-dialog/embedded-array-entry-dialog.component";

@DatabaseEntity("EmbeddedArrayDataTest")
class EmbeddedArrayDataTest extends Entity {}
EmbeddedArrayDataTest.schema.set("documents", {
  dataType: "schema-embed-array",
  label: "Documents",
  additional: {
    documentType: { dataType: "string", label: "Document Type" },
    documentNumber: { dataType: "string", label: "Document Number" },
  },
});

describe("EmbeddedArrayDataComponent", () => {
  let fixture: ComponentFixture<EmbeddedArrayDataComponent>;
  let entity: EmbeddedArrayDataTest;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  /** the result the (mocked) popup closes with */
  let dialogResult: Entity | undefined;

  beforeEach(async () => {
    dialogResult = undefined;
    mockDialog = {
      open: vi.fn(() => ({ afterClosed: () => of(dialogResult) })),
    };

    await TestBed.configureTestingModule({
      imports: [EmbeddedArrayDataComponent, MockedTestingModule.withState()],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    entity = new EmbeddedArrayDataTest();
    entity["documents"] = [
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "ID Card", documentNumber: "B2" },
    ];

    fixture = TestBed.createComponent(EmbeddedArrayDataComponent);
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("property", "documents");
  });

  async function render() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function headerTexts(): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("th"))
      .map((th) => th.textContent.trim())
      .filter((text) => text);
  }

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll("tr.table-row"));
  }

  function rowTexts(): string[][] {
    return rows().map((tr) =>
      Array.from<HTMLElement>(tr.querySelectorAll("td"))
        .map((td) => td.textContent.trim())
        .filter((text) => text),
    );
  }

  function lastDialogData(): EmbeddedArrayEntryDialogData {
    return mockDialog.open.mock.lastCall[1].data;
  }

  it.each<[string, unknown[], string[]]>([
    ["all inner fields", [], ["Document Type", "Document Number"]],
    ["the configured subset", ["documentNumber"], ["Document Number"]],
    [
      "configured columns, skipping unknown ones",
      ["unknownField", { id: "documentType", label: "Type" }],
      ["Type"],
    ],
  ])("displays %s as columns", async (_, columns, expectedHeaders) => {
    fixture.componentRef.setInput("columns", columns);
    await render();

    expect(headerTexts()).toEqual(expectedHeaders);
  });

  it("displays one row per embedded entry", async () => {
    await render();

    expect(rowTexts()).toEqual([
      ["Passport", "A1"],
      ["ID Card", "B2"],
    ]);
  });

  it("opens the popup for the clicked entry with all inner fields", async () => {
    fixture.componentRef.setInput("columns", ["documentNumber"]);
    await render();

    rows()[1].click();

    expect(mockDialog.open.mock.lastCall[0]).toBe(
      EmbeddedArrayEntryDialogComponent,
    );
    const data = lastDialogData();
    expect(data.entity).toBe(entity);
    expect(data.property).toBe("documents");
    expect(data.index).toBe(1);
    expect(data.columns.map((c) => c.id)).toEqual([
      "documentType",
      "documentNumber",
    ]);
  });

  it("opens the popup for a new entry when clicking the add button", async () => {
    await render();

    fixture.nativeElement.querySelector("th button").click();

    expect(lastDialogData().index).toBeUndefined();
  });

  it.each([
    [true, false],
    [false, true],
  ])(
    "opens the popup read-only if editable=%s is false",
    async (editable, expectReadonly) => {
      fixture.componentRef.setInput("editable", editable);
      await render();

      rows()[0].click();

      expect(lastDialogData().readonly).toBe(expectReadonly);
    },
  );

  it("displays the saved entries after the popup saved the entity", async () => {
    const saved = new EmbeddedArrayDataTest(entity.getId());
    saved["documents"] = [{ documentType: "Visa", documentNumber: "C3" }];
    dialogResult = saved;
    await render();

    rows()[0].click();
    await render();

    expect(rowTexts()).toEqual([["Visa", "C3"]]);
  });
});
