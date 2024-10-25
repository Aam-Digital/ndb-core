import { testDatatype } from "../../../core/entity/schema/entity-schema.service.spec";
import { TemplateExportFileDatatype } from "./template-export-file.datatype";

describe("Schema data type: template-export-file", () => {
  testDatatype(new TemplateExportFileDatatype(), "123", "123");
});
