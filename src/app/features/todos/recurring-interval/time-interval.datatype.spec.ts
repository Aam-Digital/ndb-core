import { TimeIntervalDatatype } from "./time-interval.datatype";
import { testDatatype } from "../../../core/entity/schema/entity-schema.service.spec";

describe("Schema data type: time-interval", () => {
  testDatatype(
    TimeIntervalDatatype,
    { amount: 3, unit: "weeks" },
    { amount: 3, unit: "weeks" },
  );
});
