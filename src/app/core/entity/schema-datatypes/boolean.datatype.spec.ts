import { testDatatype } from "../schema/entity-schema.service.spec";
import { BooleanDatatype } from "./boolean.datatype";

describe("Schema data type: boolean", () => {
  testDatatype(BooleanDatatype, true, true);
});
