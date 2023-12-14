import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { DateDatatype } from "./date.datatype";

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

  it("should log warning if transformation fails", () => {
    const mockLogger = jasmine.createSpyObj("LoggingService", ["warn"]);
    const datatype = new DateDatatype(mockLogger);

    const result = datatype.transformToObjectFormat("invalidDate", null, {
      _id: "Child:test",
      dateOfBirth: "invalidDate",
    });

    expect(result).toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
