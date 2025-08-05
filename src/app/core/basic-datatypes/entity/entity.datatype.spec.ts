import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { EntityDatatype } from "./entity.datatype";

describe("Schema data type: entity", () => {
  testDatatype(EntityDatatype, "1", "1", "User");
});
