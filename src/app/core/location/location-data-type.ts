import { EntitySchemaDatatype } from "../entity/schema/entity-schema-datatype";

export const locationEntitySchemaDataType: EntitySchemaDatatype = {
  name: "location",
  editComponent: "EditLocation",
  viewComponent: "ViewLocation",
  transformToObjectFormat: (value) => value,
  transformToDatabaseFormat: (value) => value,
};
