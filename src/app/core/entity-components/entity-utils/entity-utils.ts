import { EntityConstructor } from "../../entity/model/entity";
import { ArrayDatatype } from "../../entity/schema-datatypes/array.datatype";
import { EntityArrayDatatype } from "../../entity/schema-datatypes/entity-array.datatype";

export function isArrayDataType(dataType: string) {
  return (
    dataType === ArrayDatatype.dataType ||
    dataType === EntityArrayDatatype.dataType
  );
}

export function isArrayProperty(
  entity: EntityConstructor,
  property: string,
): boolean {
  const dataType = entity.schema.get(property).dataType;
  return isArrayDataType(dataType);
}
