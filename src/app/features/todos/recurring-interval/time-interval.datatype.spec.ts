import { TimeInterval } from "./time-interval";
import { timeIntervalDatatype } from "./time-interval.datatype";

describe("Schema data type:time-interval", () => {
  it("should save without changing value", () => {
    const entityData: TimeInterval = {amount: 3, unit: "weeks"};
    const savedData =
        timeIntervalDatatype.transformToDatabaseFormat(entityData);
    expect(savedData).toEqual(entityData);
  });

  it("should load without changing value", () => {
    const dbData: TimeInterval = {amount: 3, unit: "weeks"};
    const loadedData = timeIntervalDatatype.transformToObjectFormat(dbData);
    expect(loadedData).toEqual(dbData);
  });
});
