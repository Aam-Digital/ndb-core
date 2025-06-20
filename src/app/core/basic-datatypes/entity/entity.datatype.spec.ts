import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { EntityDatatype } from "./entity.datatype";

describe("Schema data type: entity", () => {
  testDatatype(
    new EntityDatatype(null as any, null as any, null),
    "1",
    "1",
    "User",
  );
});
