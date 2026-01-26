import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { EntityDatatype } from "./entity.datatype";

describe("Schema data type: entity", () => {
  testDatatype(EntityDatatype, "1", "1", "User");

  // keep undefined and null unchanged
  testDatatype(EntityDatatype, undefined, undefined, "User");
  testDatatype(EntityDatatype, null, null, "User");
});
