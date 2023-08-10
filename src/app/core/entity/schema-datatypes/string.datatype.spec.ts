import { testDatatype } from "../schema/entity-schema.service.spec";
import { StringDatatype } from "./string.datatype";

describe("Schema data type: string", () => {
  testDatatype(StringDatatype, "test", "test");
});
