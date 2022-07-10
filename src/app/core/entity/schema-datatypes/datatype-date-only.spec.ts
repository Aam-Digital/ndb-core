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
});
