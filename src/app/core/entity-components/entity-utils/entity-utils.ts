import { arrayEntitySchemaDatatype } from "../../entity/schema-datatypes/datatype-array";
import { entityArrayEntitySchemaDatatype } from "../../entity/schema-datatypes/datatype-entity-array";
import { EntityConstructor } from "../../entity/model/entity";

export function isArrayDataType(dataType: string) {
  return (
    dataType === arrayEntitySchemaDatatype.name ||
    dataType === entityArrayEntitySchemaDatatype.name
  );
}

export function isArrayProperty(
  entity: EntityConstructor,
  property: string
): boolean {
  const dataType = entity.schema.get(property).dataType;
  return isArrayDataType(dataType);
}
