import { EntitySchemaDatatype } from "../schema/entity-schema-datatype";

/**
 * Datatype to make a file attachment property available in an entity.
 * Attachment (file) itself is not stored as part of the database document but uploaded separatedly.
 */
export const fileEntitySchemaDatatype: EntitySchemaDatatype = {
  name: "file",
  editComponent: "EditFile",

  transformToDatabaseFormat: (value: any) => value,

  transformToObjectFormat: (value: any) => value,
};
