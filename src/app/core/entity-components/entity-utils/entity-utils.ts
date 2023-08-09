import { ArrayDatatype } from "../../entity/schema-datatypes/datatype-array";
import { EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { EntityArrayDatatype } from "../../entity/schema-datatypes/datatype-entity-array";

export function isArrayDataType(dataType: string) {
  return (
    dataType === ArrayDatatype.dataType ||
    dataType === EntityArrayDatatype.dataType
  );
}

export function getInnermostDatatype(schema: EntitySchemaField) {
  if (isArrayDataType(schema.dataType)) {
    return schema.innerDataType;
  } else {
    return schema.dataType;
  }
}

export function isArrayProperty(
  entity: EntityConstructor,
  property: string,
): boolean {
  const dataType = entity.schema.get(property).dataType;
  return isArrayDataType(dataType);
}
