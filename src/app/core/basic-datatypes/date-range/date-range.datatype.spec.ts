import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import { DateRangeDatatype } from "./date-range.datatype";

describe("Schema data type: date-range", () => {
  testDatatype(
    new DateRangeDatatype(),
    { start: new Date(2026, 2, 1), end: new Date(2026, 4, 31) },
    { start: "2026-03-01", end: "2026-05-31" },
  );

  const datatype = new DateRangeDatatype();

  it.each([
    [
      "only a start date",
      { start: new Date(2026, 2, 1) },
      { start: "2026-03-01" },
    ],
    ["only an end date", { end: new Date(2026, 4, 31) }, { end: "2026-05-31" }],
  ])("converts a range with %s in both directions", (_, object, database) => {
    expect(datatype.transformToDatabaseFormat(object)).toEqual(database);
    expect(datatype.transformToObjectFormat(database)).toEqual(object);
  });

  it.each([
    ["nothing", undefined],
    ["an empty object", {}],
    ["text", "2026-03-01"],
    ["a date that cannot be read", { start: "not a date" }],
    ["a date in the wrong format", { start: 20260301 }],
  ])("reads %s as no value", (_, databaseValue) => {
    expect(
      datatype.transformToObjectFormat(databaseValue as any),
    ).toBeUndefined();
  });

  it("does not store an empty range", () => {
    expect(datatype.transformToDatabaseFormat({})).toBeUndefined();
    expect(datatype.transformToDatabaseFormat(undefined)).toBeUndefined();
  });

  it("sorts by the start date, or by the end date if there is no start date", () => {
    const range = { start: new Date(2026, 2, 1), end: new Date(2026, 4, 31) };
    expect(datatype.sortValue(range)).toBe(range.start.getTime());
    expect(datatype.sortValue({ end: range.end })).toBe(range.end.getTime());
    expect(datatype.sortValue(undefined)).toBeUndefined();
  });

  it("exports the start and the end date in separate columns", () => {
    const range = { start: new Date(2026, 2, 1), end: new Date(2026, 4, 31) };

    const columns = datatype.getExportColumns({
      id: "period",
      label: "Period",
    });

    expect(columns.map((c) => [c.keySuffix, c.label])).toEqual([
      ["_start", "Period (start)"],
      ["_end", "Period (end)"],
    ]);
    expect(columns.map((c) => c.resolveValue(range, undefined))).toEqual([
      range.start,
      range.end,
    ]);
  });

  it("keeps only the year when anonymizing", async () => {
    const anonymized = await datatype.anonymize({
      start: new Date(2026, 2, 1),
      end: new Date(2027, 4, 31),
    });

    expect(anonymized).toEqual({
      start: new Date(2026, 6, 1),
      end: new Date(2027, 6, 1),
    });
  });
});
