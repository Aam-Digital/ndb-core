import { testDatatype } from "../schema/entity-schema.service.spec";
import { NumberDatatype } from "./number.datatype";

describe("Schema data type: number", () => {
  testDatatype(NumberDatatype, 42, 42);
});
