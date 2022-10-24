import { EntitySchemaDatatype } from "../schema/entity-schema-datatype";

export const fileEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "file",
  editComponent: "edit-file",

  transformToDatabaseFormat: (value: any) => value,

  transformToObjectFormat: (value: any) => value,
};
