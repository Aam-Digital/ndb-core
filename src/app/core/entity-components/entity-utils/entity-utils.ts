import { EntityConstructor } from "../../entity/model/entity";

export function isArrayDataType(dataType: string) {
  return (
    // do not use the Datatype classes here to avoid circular dependencies with EntitySchemaService
    dataType === "array" || dataType === "entity-array"
  );
}

export function isArrayProperty(
  entity: EntityConstructor,
  property: string,
): boolean {
  const dataType = entity.schema.get(property).dataType;
  return isArrayDataType(dataType);
}
