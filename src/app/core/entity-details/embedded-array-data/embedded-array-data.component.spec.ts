import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EmbeddedArrayDataComponent } from "./embedded-array-data.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { SchemaEmbedArrayTableComponent } from "#src/app/core/basic-datatypes/schema-embed/schema-embed-array-table/schema-embed-array-table.component";

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
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmbeddedArrayDataComponent, MockedTestingModule.withState()],
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

  /**
   * Cell content loads through `appDynamicComponent`, which resolves its view component
   * via a dynamic `import()` that `fixture.whenStable()` does not reliably wait for
   * (zone.js does not track native dynamic imports), so polling is needed to observe it.
   */
  async function waitForRowTexts(expected: string[][]) {
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(rowTexts()).toEqual(expected);
    });
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

    await waitForRowTexts([
      ["Passport", "A1"],
      ["ID Card", "B2"],
    ]);
  });

  function table(): SchemaEmbedArrayTableComponent {
    return fixture.debugElement.query(
      By.directive(SchemaEmbedArrayTableComponent),
    ).componentInstance;
  }

  it("lets the popup edit all inner fields, also if not displayed", async () => {
    fixture.componentRef.setInput("columns", ["documentNumber"]);
    await render();

    expect(
      table()
        .editColumns()
        .map((c) => c.id),
    ).toEqual(["documentType", "documentNumber"]);
    expect(table().entity()).toBe(entity);
  });

  it.each([
    [true, false],
    [false, true],
  ])("is read-only if editable=%s is false", async (editable, expected) => {
    fixture.componentRef.setInput("editable", editable);
    await render();

    expect(table().readonly()).toBe(expected);
  });

  it("is read-only if the user lacks permission to update the entity", async () => {
    vi.spyOn(TestBed.inject(EntityAbility), "cannot").mockReturnValue(true);
    await render();

    expect(table().readonly()).toBe(true);
  });

  it("saves the entity with the changed entries and displays them", async () => {
    const saveSpy = vi.spyOn(TestBed.inject(EntityMapperService), "save");
    await render();

    await table().applyChange()([
      { documentType: "Visa", documentNumber: "C3" },
    ]);

    expect(saveSpy.mock.lastCall[0]["documents"]).toEqual([
      { documentType: "Visa", documentNumber: "C3" },
    ]);
    await waitForRowTexts([["Visa", "C3"]]);
  });

  it("keeps displaying the previous entries and passes on the error if saving fails", async () => {
    vi.spyOn(TestBed.inject(EntityMapperService), "save").mockRejectedValue(
      new Error("save failed"),
    );
    await render();

    await expect(
      table().applyChange()([{ documentType: "Visa", documentNumber: "C3" }]),
    ).rejects.toThrow("save failed");

    fixture.detectChanges();
    await waitForRowTexts([
      ["Passport", "A1"],
      ["ID Card", "B2"],
    ]);
  });
});
