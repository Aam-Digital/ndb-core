import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { DateDatatype } from "./date.datatype";

describe("Schema data type: date", () => {
  testDatatype(
    new DateDatatype(),
    new Date(2023, 10, 25),
    new Date(2023, 10, 25),
  );
});
