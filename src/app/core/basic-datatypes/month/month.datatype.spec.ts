import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { MonthDatatype } from "./month.datatype";

describe("Schema data type: month", () => {
  testDatatype(new MonthDatatype(null), new Date(2023, 10), "2023-11");
});
