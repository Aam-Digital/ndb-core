import { EntitySchemaDatatype } from "../../core/entity/schema/entity-schema-datatype";

export const locationEntitySchemaDataType: EntitySchemaDatatype = {
  name: "location",
  editComponent: "EditLocation",
  viewComponent: "ViewLocation",
  transformToObjectFormat: (value) => value,
  transformToDatabaseFormat: (value) => value,
};
