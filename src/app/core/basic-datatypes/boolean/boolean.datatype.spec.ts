import { testDatatype } from "../../entity/schema/entity-schema.service.test-utils";
import { BooleanDatatype } from "./boolean.datatype";

describe("Schema data type: boolean", () => {
  testDatatype(new BooleanDatatype(), true, true);
});
