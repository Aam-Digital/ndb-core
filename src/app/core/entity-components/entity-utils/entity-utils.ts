import { ArrayDatatype } from "../../entity/schema-datatypes/datatype-array";
import { entityArrayEntitySchemaDatatype } from "../../entity/schema-datatypes/datatype-entity-array";
import { EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

export function isArrayDataType(dataType: string) {
  return (
    dataType === ArrayDatatype.dataType ||
    dataType === entityArrayEntitySchemaDatatype.name
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
