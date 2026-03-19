import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import { StringDatatype } from "./string.datatype";

describe("Schema data type: string", () => {
  testDatatype(new StringDatatype(), "test", "test");
});
