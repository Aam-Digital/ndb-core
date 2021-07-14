import { dateOnlyEntitySchemaDatatype } from "./datatype-date-only";

describe("Schema data type:Date", () => {
  it("should not fail on null values", () => {
    const nullDateRes =
      dateOnlyEntitySchemaDatatype.transformToDatabaseFormat(null);
    expect(nullDateRes).toBeUndefined();
  });
});
