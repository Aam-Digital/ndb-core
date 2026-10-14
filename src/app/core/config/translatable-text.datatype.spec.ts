import { TestBed } from "@angular/core/testing";

import { configureActiveLocale } from "../language/active-locale";
import { AVAILABLE_LOCALE_IDS } from "../language/available-locales";
import { TranslatableTextDatatype } from "./translatable-text.datatype";

describe("TranslatableTextDatatype", () => {
  let datatype: TranslatableTextDatatype;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslatableTextDatatype],
    });
    datatype = TestBed.inject(TranslatableTextDatatype);
    configureActiveLocale("de", AVAILABLE_LOCALE_IDS);
  });

  afterEach(() => {
    configureActiveLocale("en-US", AVAILABLE_LOCALE_IDS);
  });

  it("keeps the full translation map when saving (does not flatten)", () => {
    const raw = { "en-US": "Subject", de: "Betreff" };

    expect(datatype.transformToDatabaseFormat(raw)).toEqual(raw);
  });

  it("keeps the raw value when loading, so the entity stays the source of truth", () => {
    const raw = { "en-US": "Subject", de: "Betreff" };

    expect(datatype.transformToObjectFormat(raw)).toEqual(raw);
  });

  it("passes plain strings through unchanged in both directions", () => {
    expect(datatype.transformToDatabaseFormat("Subject")).toBe("Subject");
    expect(datatype.transformToObjectFormat("Subject")).toBe("Subject");
  });

  it("sorts by the text of the active language", () => {
    expect(datatype.sortValue({ "en-US": "Subject", de: "Betreff" })).toBe(
      "Betreff",
    );
    expect(datatype.sortValue("Plain")).toBe("Plain");
  });

  it("exports the text of the active language rather than the raw map", () => {
    const columns = datatype.getExportColumns({ label: "Subject" } as any);

    expect(columns).toHaveLength(1);
    expect(
      columns[0].resolveValue({ "en-US": "Subject", de: "Betreff" }, {} as any),
    ).toBe("Betreff");
  });

  it("declares the components that resolve for display and edit translations", () => {
    expect(datatype.viewComponent).toBe("DisplayTranslatableText");
    expect(datatype.editComponent).toBe("EditTranslatableText");
  });
});
