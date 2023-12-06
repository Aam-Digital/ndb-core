import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { DateDatatype } from "./date.datatype";

describe("Schema data type: date", () => {
  testDatatype(
    new DateDatatype(null),
    new Date(2023, 10, 25),
    new Date(2023, 10, 25),
  );

  it("should anonymize dates and only retain year", async () => {
    const datatype = new DateDatatype(null);
    const testDate = new Date(2023, 10, 25);

    const actualAnonymized = await datatype.anonymize(testDate);
    expect(actualAnonymized).toEqual(new Date(2023, 6, 1));
  });
});
