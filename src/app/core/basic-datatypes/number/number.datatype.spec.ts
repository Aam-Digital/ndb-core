import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import { NumberDatatype } from "./number.datatype";

describe("Schema data type: number", () => {
  testDatatype(new NumberDatatype(), 42, 42);
});
