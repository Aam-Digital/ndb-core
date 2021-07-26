import { EntitySchemaDatatype } from "../schema/entity-schema-datatype";

export const booleanEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "boolean",
  editComponent: "EditBoolean",
  viewComponent: "DisplayCheckmark",

  transformToDatabaseFormat: (value: boolean) => value,

  transformToObjectFormat: (value) => value,
};
