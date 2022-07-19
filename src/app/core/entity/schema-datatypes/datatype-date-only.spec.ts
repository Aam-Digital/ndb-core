import { dateOnlyEntitySchemaDatatype } from "./datatype-date-only";

describe("Schema data type:Date", () => {
  it("should not fail on null values", () => {
    const nullDateRes =
      dateOnlyEntitySchemaDatatype.transformToDatabaseFormat(null);
    expect(nullDateRes).toBeUndefined();
  });

  it("should correctly transform values", () => {
    const date = new Date(2022, 0, 1);

    const dbFormat =
      dateOnlyEntitySchemaDatatype.transformToDatabaseFormat(date);
    expect(dbFormat).toBe("2022-01-01");

    const objFormat: Date =
      dateOnlyEntitySchemaDatatype.transformToObjectFormat(dbFormat);
    expect(objFormat).toBeInstanceOf(Date);
    expect(objFormat.getFullYear()).toBe(2022);
    expect(objFormat.getMonth()).toBe(0);
    expect(objFormat.getDate()).toBe(1);
  });

  it("should fallback to legacy date parsing if format is unsupported", () => {
    let date: Date = dateOnlyEntitySchemaDatatype.transformToObjectFormat(
      "2013-01-12T00:00:00.000Z"
    );
    expect(date.getFullYear()).toBe(2013);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(12);

    date = dateOnlyEntitySchemaDatatype.transformToObjectFormat("4/1/2021");
    expect(date.getFullYear()).toBe(2021);
    expect(date.getMonth()).toBe(3);
    expect(date.getDate()).toBe(1);
  });
});
