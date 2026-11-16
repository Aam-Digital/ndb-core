import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EmbeddedArrayDataComponent } from "./embedded-array-data.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { InvalidFormFieldError } from "#src/app/core/common-components/entity-form/invalid-form-field.error";
import { SchemaEmbedArrayTableComponent } from "#src/app/core/basic-datatypes/schema-embed/schema-embed-array-table/schema-embed-array-table.component";
import {
  SchemaEmbedArrayEntryChange,
  SchemaEmbedArrayEntryConflictError,
} from "#src/app/core/basic-datatypes/schema-embed/schema-embed-array-entry-change";
import { AutomatedFieldUpdateConfigService } from "#src/app/features/inherited-field/automated-field-update/automated-field-update-config.service";

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

@DatabaseEntity("EmbeddedArrayDataRequiredTest")
class EmbeddedArrayDataRequiredTest extends Entity {}
EmbeddedArrayDataRequiredTest.schema.set("documents", {
  dataType: "schema-embed-array",
  label: "Documents",
  validators: { required: true },
  additional: {
    documentType: { dataType: "string", label: "Document Type" },
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
    // an existing record (a new one is read-only here)
    entity._rev = "1-existing";

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
    expect(table().field().id).toBe("documents");
  });

  it.each([
    [true, false],
    [false, true],
  ])("is read-only if editable=%s is false", async (editable, expected) => {
    fixture.componentRef.setInput("editable", editable);
    await render();

    expect(table().readonly()).toBe(expected);
  });

  it("is read-only for a new record, which is saved through its main form first", async () => {
    fixture.componentRef.setInput("entity", new EmbeddedArrayDataTest());
    await render();

    expect(table().readonly()).toBe(true);
  });

  it("explains a validation error of the whole property instead of a generic message", async () => {
    const record = new EmbeddedArrayDataRequiredTest();
    record["documents"] = [{ documentType: "Passport" }];
    record._rev = "1-existing";
    fixture.componentRef.setInput("entity", record);
    await render();

    const result = table().applyChange()({
      delete: true,
      index: 0,
      original: record["documents"][0],
    });

    await expect(result).rejects.not.toBeInstanceOf(InvalidFormFieldError);
    await expect(result).rejects.toThrow(/required/i);
  });

  it("is read-only if the user lacks permission to update the entity", async () => {
    vi.spyOn(TestBed.inject(EntityAbility), "cannot").mockReturnValue(true);
    await render();

    expect(table().readonly()).toBe(true);
  });

  function spyOnAutomatedUpdates() {
    return vi
      .spyOn(
        TestBed.inject(AutomatedFieldUpdateConfigService),
        "applyRulesToDependentEntities",
      )
      .mockResolvedValue([]);
  }

  it("saves the entity with the changed entry, displays the entries and updates the linked records", async () => {
    const saveSpy = vi.spyOn(TestBed.inject(EntityMapperService), "save");
    const applyRules = spyOnAutomatedUpdates();
    await render();

    await table().applyChange()({
      entry: { documentType: "Visa", documentNumber: "B2" },
      index: 1,
      original: { documentType: "ID Card", documentNumber: "B2" },
    });

    const expected = [
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "Visa", documentNumber: "B2" },
    ];
    expect(saveSpy.mock.lastCall[0]["documents"]).toEqual(expected);
    // like a save of the form, the rules of fields that this field is the source of are applied
    const [savedEntity, entityBefore] = applyRules.mock.lastCall;
    expect(savedEntity["documents"]).toEqual(expected);
    expect(entityBefore["documents"]).toEqual([
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "ID Card", documentNumber: "B2" },
    ]);
    await waitForRowTexts([
      ["Passport", "A1"],
      ["Visa", "B2"],
    ]);
  });

  const passport = { documentType: "Passport", documentNumber: "A1" };
  const idCard = { documentType: "ID Card", documentNumber: "B2" };
  const visa = { documentType: "Visa", documentNumber: "C3" };
  const syncedEntry = { documentType: "Synced", documentNumber: "S1" };

  it.each<[string, SchemaEmbedArrayEntryChange, Record<string, any>[]]>([
    ["adding", { entry: visa }, [syncedEntry, passport, idCard, visa]],
    [
      "editing",
      { entry: visa, index: 1, original: idCard },
      [syncedEntry, passport, visa],
    ],
    [
      "deleting",
      { delete: true, index: 0, original: passport },
      [syncedEntry, idCard],
    ],
  ])(
    "keeps entries updated since the popup opened when %s an entry",
    async (_, change, expected) => {
      const saveSpy = vi.spyOn(TestBed.inject(EntityMapperService), "save");
      await render();
      // e.g. a sync brings in another user's entry while the popup is open
      const updated = entity.copy();
      updated["documents"] = [syncedEntry, ...entity["documents"]];
      fixture.componentRef.setInput("entity", updated);
      await render();

      await table().applyChange()(change);

      expect(saveSpy.mock.lastCall[0]["documents"]).toEqual(expected);
    },
  );

  it("does not save if the opened entry has been changed in the meantime", async () => {
    const saveSpy = vi.spyOn(TestBed.inject(EntityMapperService), "save");
    await render();
    const updated = entity.copy();
    updated["documents"] = [passport, { ...idCard, documentNumber: "X9" }];
    fixture.componentRef.setInput("entity", updated);
    await render();

    await expect(
      table().applyChange()({ entry: visa, index: 1, original: idCard }),
    ).rejects.toThrow(SchemaEmbedArrayEntryConflictError);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("keeps displaying the previous entries, updates no linked records and passes on the error if saving fails", async () => {
    vi.spyOn(TestBed.inject(EntityMapperService), "save").mockRejectedValue(
      new Error("save failed"),
    );
    const applyRules = spyOnAutomatedUpdates();
    await render();

    await expect(
      table().applyChange()({
        entry: { documentType: "Visa", documentNumber: "C3" },
      }),
    ).rejects.toThrow("save failed");
    expect(applyRules).not.toHaveBeenCalled();

    fixture.detectChanges();
    await waitForRowTexts([
      ["Passport", "A1"],
      ["ID Card", "B2"],
    ]);
  });
});
