import { createEmbeddedEntity, EmbeddedEntity } from "./embedded-entity";
import { Entity } from "./entity";
import { EntitySchema } from "../schema/entity-schema";

describe("EmbeddedEntity", () => {
  const schema: EntitySchema = new Map([
    ["documentType", { dataType: "string" }],
    ["documentNumber", { dataType: "string" }],
  ]);
  const record = new Entity("record");

  it.each<[string, Record<string, any>, Record<string, any>]>([
    [
      "sets edited inner fields",
      { documentType: "Visa" },
      { documentType: "Visa", documentNumber: "A1", legacyField: "kept" },
    ],
    [
      "removes cleared inner fields",
      { documentNumber: undefined },
      { documentType: "Passport", legacyField: "kept" },
    ],
  ])(
    "turns back into a plain entry that %s and keeps properties that are no inner fields",
    (_, changes, expected) => {
      const original = {
        documentType: "Passport",
        documentNumber: "A1",
        legacyField: "kept",
      };
      const entry = createEmbeddedEntity(
        schema,
        { record, field: "documents", existing: true },
        original,
      );

      Object.assign(entry, changes);

      expect(entry.toEntryValue(original)).toEqual(expected);
      expect(original.documentType).toBe("Passport");
    },
  );

  it("keeps where it belongs when copied, as forms edit copies", () => {
    const entry = createEmbeddedEntity(
      schema,
      { record, field: "documents", existing: false },
      { documentType: "Passport" },
    );

    const copy = entry.copy();

    expect(copy).toBeInstanceOf(EmbeddedEntity);
    expect(copy.isNew).toBe(true);
    expect(copy.getRoot()).toEqual({ record, field: "documents" });
    expect(copy.toEntryValue()).toEqual({ documentType: "Passport" });
  });

  it.each<
    [string, () => EmbeddedEntity, ReturnType<EmbeddedEntity["getRoot"]>]
  >([
    [
      "the record holding it",
      () =>
        createEmbeddedEntity(schema, {
          record,
          field: "documents",
          existing: true,
        }),
      { record, field: "documents" },
    ],
    [
      "the record holding the outer entry, for a nested entry",
      () =>
        createEmbeddedEntity(schema, {
          record: createEmbeddedEntity(schema, {
            record,
            field: "documents",
            existing: true,
          }),
          field: "documentNumber",
          existing: false,
        }),
      { record, field: "documents" },
    ],
    [
      "nothing, if edited without a record",
      () =>
        createEmbeddedEntity(schema, { field: "documents", existing: true }),
      undefined,
    ],
  ])("is saved through %s", (_, createEntry, expected) => {
    expect(createEntry().getRoot()).toEqual(expected);
  });
});
