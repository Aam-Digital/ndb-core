import { FormControl } from "@angular/forms";
import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import {
  DateRangeDatabaseValue,
  DateRangeDatatype,
  DateRangeValue,
  endNotBeforeStart,
} from "./date-range.datatype";
import { isOutsideRange } from "./is-outside-range";

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
      datatype.transformToObjectFormat(databaseValue as DateRangeDatabaseValue),
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

  const start = new Date(2026, 2, 1);
  const end = new Date(2026, 4, 31);
  it.each([
    ["no value", null, true],
    ["only a start date", { start }, true],
    ["only an end date", { end }, true],
    ["the end date after the start date", { start, end }, true],
    ["the same day", { start, end: start }, true],
    ["the end date before the start date", { start: end, end: start }, false],
  ])("validator: %s", (_, value, valid) => {
    expect(endNotBeforeStart(new FormControl(value)) === null).toBe(valid);
  });
});

describe("isOutsideRange", () => {
  const outer: DateRangeValue = {
    start: new Date(2026, 2, 1),
    end: new Date(2026, 4, 31),
  };

  it.each<[string, DateRangeValue | undefined, DateRangeValue | undefined]>([
    [
      "a range within the outer range",
      { start: new Date(2026, 2, 10), end: new Date(2026, 2, 20) },
      outer,
    ],
    ["a range with the same dates as the outer range", { ...outer }, outer],
    [
      "dates at a later time of the outer range's last day",
      { start: new Date(2026, 2, 1, 15), end: new Date(2026, 4, 31, 15) },
      outer,
    ],
    ["an empty range", undefined, outer],
    ["a range without any date", {}, outer],
    [
      "an outer range without any date",
      { start: new Date(2020, 0, 1), end: new Date(2030, 0, 1) },
      {},
    ],
    [
      "no outer range",
      { start: new Date(2020, 0, 1), end: new Date(2030, 0, 1) },
      undefined,
    ],
    [
      "an ongoing range in an ongoing outer range",
      { start: new Date(2026, 2, 10) },
      { start: new Date(2026, 2, 1) },
    ],
  ])("should not be outside for %s", (_, range, outerRange) => {
    expect(isOutsideRange(range, outerRange)).toBe(false);
  });

  it.each<[string, DateRangeValue]>([
    [
      "a start before the outer range",
      { start: new Date(2026, 1, 28), end: new Date(2026, 2, 20) },
    ],
    [
      "an end after the outer range",
      { start: new Date(2026, 4, 20), end: new Date(2026, 5, 15) },
    ],
    ["an ongoing range (no end)", { start: new Date(2026, 2, 10) }],
    ["a range without a start", { end: new Date(2026, 2, 20) }],
  ])("should be outside for %s", (_, range) => {
    expect(isOutsideRange(range, outer)).toBe(true);
  });
});
