import { getReadableValue } from "../value-accessor/value-accessor";
import { Entity } from "../../../entity/model/entity";
import { Ordering } from "../../../basic-datatypes/configurable-enum/configurable-enum-ordering";
import { TableRow } from "../table-row";

/**
 * Custom sort implementation for a MatTableDataSource<TableRow<T>>
 * @param data The data of the data source
 * @param direction direction "asc", "desc" or "" meaning none
 * @param active the property of T for which it should be sorted
 * @returns the sorted table rows
 */
export function tableSort<OBJECT extends Entity, PROPERTY extends keyof OBJECT>(
  data: TableRow<OBJECT>[],
  {
    direction,
    active,
  }: { direction: "asc" | "desc" | ""; active: PROPERTY | "" },
): TableRow<OBJECT>[] {
  if (direction === "" || !active) {
    return data;
  }
  data.sort((objA, objB) => {
    const valueA = getComparableValue(objA.record, active);
    const valueB = getComparableValue(objB.record, active);
    const primaryComparison = compareValues(valueA, valueB);

    // If the primary values are equal, sort by the created at
    if (primaryComparison === 0) {
      const dateA = new Date(objA.record.created?.at || 0).getTime();
      const dateB = new Date(objB.record.created?.at || 0).getTime();

      return dateA - dateB;
    }

    return primaryComparison;
  });
  if (direction === "desc") {
    data.reverse();
  }
  return data;
}

function getComparableValue<OBJECT, PROPERTY extends keyof OBJECT>(
  obj: OBJECT,
  key: PROPERTY,
): number | string | Symbol {
  let value = obj[key];

  // Special handling for Age columns
  if (value === undefined && key === "age") {
    // default assuming dateOfBirth field
    key = "age_dateOfBirth" as any;
  }
  if (value === undefined && String(key).startsWith("age_")) {
    const fieldKey = String(key).replace("age_", "");
    return obj[fieldKey]?.age;
  }

  if (Ordering.hasOrdinalValue(value)) {
    return value._ordinal;
  }
  value = getReadableValue(value);
  if (value instanceof Date) {
    return value.getTime() + "";
  } else if (typeof value === "number") {
    return value + "";
  } else {
    return value as any;
  }
}

function compareValues(a, b) {
  if (a === b) {
    return 0;
  } else if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b, undefined, { numeric: true });
  } else if (a > b || b === null || b === undefined) {
    return -1;
  } else if (a < b || a === null || a === undefined) {
    return 1;
  } else if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
}
