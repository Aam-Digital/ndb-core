import { getReadableValue } from "./value-accessor";
import { TableRow } from "./entity-subrecord.component";

/**
 * Custom sort implementation for a MatTableDataSource<TableRow<T>>
 * @param data The data of the data source
 * @param direction direction "asc", "desc" or "" meaning none
 * @param active the property of T for which it should be sorted
 * @returns the sorted table rows
 */
export function tableSort<OBJECT, PROPERTY extends keyof OBJECT>(
  data: TableRow<OBJECT>[],
  {
    direction,
    active,
  }: { direction: "asc" | "desc" | ""; active: PROPERTY | "" }
): TableRow<OBJECT>[] {
  if (direction === "" || !active) {
    return data;
  }
  data.sort((objA, objB) => {
    const valueA = getComparableValue(objA.record, active);
    const valueB = getComparableValue(objB.record, active);
    return compareValues(valueA, valueB);
  });
  if (direction === "desc") {
    data.reverse();
  }
  return data;
}

function getComparableValue<OBJECT, PROPERTY extends keyof OBJECT>(
  obj: OBJECT,
  key: PROPERTY
): OBJECT[PROPERTY] | string {
  const value = getReadableValue(obj, key) as OBJECT[PROPERTY];
  if (value instanceof Date) {
    return value.getTime() + "";
  } else if (typeof value === "number") {
    return value + "";
  } else {
    return value;
  }
}

function compareValues(a: any, b: any) {
  let result = 0;
  if (a === b) {
    result = 0;
  } else if (typeof a === "string" && typeof b === "string") {
    result = a.localeCompare(b, undefined, { numeric: true });
  } else if (a > b || b === null || b === undefined) {
    result = -1;
  } else if (a < b || a === null || a === undefined) {
    result = 1;
  }
  return result;
}
