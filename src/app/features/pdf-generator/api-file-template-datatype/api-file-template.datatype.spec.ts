import { testDatatype } from "../../../core/entity/schema/entity-schema.service.spec";
import { ApiFileTemplateDatatype } from "./api-file-template.datatype";

describe("Schema data type: api-file-template", () => {
  testDatatype(new ApiFileTemplateDatatype(), "123", "123");
});
