import { waitForAsync } from "@angular/core/testing";
import { DateOnlyDatatype } from "./datatype-date-only";

describe("Schema data type: date-only", () => {
  let dataType: DateOnlyDatatype;

  beforeEach(waitForAsync(() => {
    dataType = new DateOnlyDatatype();
  }));

  it("should not fail on null values", () => {
    const nullDateRes = dataType.transformToDatabaseFormat(null);
    expect(nullDateRes).toBeUndefined();
  });

  it("should correctly transform values", () => {
    const date = new Date(2022, 0, 1);

    const dbFormat = dataType.transformToDatabaseFormat(date);
    expect(dbFormat).toBe("2022-01-01");

    const objFormat: Date = dataType.transformToObjectFormat(dbFormat);
    expect(objFormat).toBeInstanceOf(Date);
    expect(objFormat.getFullYear()).toBe(2022);
    expect(objFormat.getMonth()).toBe(0);
    expect(objFormat.getDate()).toBe(1);
  });

  it("should fallback to legacy date parsing if format is unsupported", () => {
    let date: Date = dataType.transformToObjectFormat(
      "2013-01-12T00:00:00.000Z",
    );
    expect(date.getFullYear()).toBe(2013);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(12);

    date = dataType.transformToObjectFormat("4/1/2021");
    expect(date.getFullYear()).toBe(2021);
    expect(date.getMonth()).toBe(3);
    expect(date.getDate()).toBe(1);
  });

  it("should migrate ISO date strings (created with timezone offsets) to a date-only", () => {
    const testCases = [
      { input: "2022-01-01", expected: "2022-01-01" },
      // clean midnight dates are transformed to the inferred day
      { input: "2023-01-20T00:00:00.000Z", expected: "2023-01-20" },
      { input: "2022-12-31T22:00:00.000Z", expected: "2023-01-01" },
      { input: "2022-12-31T19:30:00.000Z", expected: "2023-01-01" },
      { input: "2023-01-01T05:00:00.000Z", expected: "2023-01-01" },
      // exact dates do not allow to safely guess offset, so cut off time details to get a value independent of device location
      { input: "2023-01-06T00:03:35.726Z", expected: "2023-01-06" },
      { input: "2023-01-06T23:59:39.726Z", expected: "2023-01-06" },
    ];

    for (const test of testCases) {
      const obj = dataType.transformToObjectFormat(test.input);
      const actualString = dataType.transformToDatabaseFormat(obj);
      expect(actualString).withContext(test.input).toEqual(test.expected);
    }
  });

  it("should parse dates using importMappingFunction", () => {
    //TODO const mappingFn = service.getMappingFunction({ dataType: "date" });
    const input = "30.11.2023";

    const actualMapped = null; //mappingFn(input, "DD.MM.YYYY");

    expect(actualMapped).toEqual(new Date(2023, 10, 30));
  });
});
