import { EntityConstructor } from "../entity/model/entity";
import { ArrayDatatype } from "./array/array.datatype";

export function isArrayDataType(dataType: string) {
  return dataType === ArrayDatatype.dataType;
}

export function isArrayProperty(
  entity: EntityConstructor,
  property: string,
): boolean {
  const dataType = entity.schema.get(property).dataType;
  return isArrayDataType(dataType);
}
