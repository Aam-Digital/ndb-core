import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { DateDatatype } from "./date.datatype";
import { Logging } from "../../logging/logging.service";

describe("Schema data type: date", () => {
  testDatatype(
    new DateDatatype(),
    new Date(2023, 10, 25),
    new Date(2023, 10, 25),
  );

  it("should anonymize dates and only retain year", async () => {
    const datatype = new DateDatatype();
    const testDate = new Date(2023, 10, 25);

    const actualAnonymized = await datatype.anonymize(testDate);
    expect(actualAnonymized).toEqual(new Date(2023, 6, 1));
  });

  it("should log (debug) if transformation fails", () => {
    spyOn(Logging, "debug");
    const datatype = new DateDatatype();

    const result = datatype.transformToObjectFormat("invalidDate", null, {
      _id: "Child:test",
      dateOfBirth: "invalidDate",
    });

    expect(result).toBeUndefined();
    expect(Logging.debug).toHaveBeenCalled();
  });
});
