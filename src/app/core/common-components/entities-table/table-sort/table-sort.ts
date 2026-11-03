import { getReadableValue } from "../value-accessor/value-accessor";
import { Entity } from "../../../entity/model/entity";

/**
 * Map of column id to a function that derives the value used for sorting that column.
 * Each function receives the raw column value and the full record, and returns a
 * comparable value or `undefined` to fall back to default sorting in {@link tableSort}.
 */
export type SortValueFns<OBJECT> = Record<
  string,
  (value: unknown, record: OBJECT) => number | string | undefined
>;

/**
 * Custom sort implementation for a MatTableDataSource<T> of entities
 * @param data The data of the data source
 * @param direction direction "asc", "desc" or "" meaning none
 * @param active the property of T for which it should be sorted
 * @returns the sorted records
 */
export function tableSort<OBJECT extends Entity, PROPERTY extends keyof OBJECT>(
  data: OBJECT[],
  {
    direction,
    active,
    sortValueFns,
  }: {
    direction: "asc" | "desc" | "";
    active: PROPERTY | "";
    sortValueFns?: SortValueFns<OBJECT>;
  },
): OBJECT[] {
  if (direction === "" || !active) {
    return data;
  }
  data.sort((objA, objB) => {
    const valueA = getComparableValue(objA, active, sortValueFns);
    const valueB = getComparableValue(objB, active, sortValueFns);
    const primaryComparison = compareValues(valueA, valueB);

    // If the primary values are equal, sort by the created at
    if (primaryComparison === 0) {
      const dateA = new Date(objA.created?.at || 0).getTime();
      const dateB = new Date(objB.created?.at || 0).getTime();

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
  sortValueFns?: SortValueFns<OBJECT>,
): number | string | Symbol {
  let value = obj[key];

  const customSortValue = sortValueFns?.[String(key)]?.(value, obj);
  if (customSortValue !== undefined) {
    return customSortValue;
  }

  value = getReadableValue(value);
  if (value instanceof Date) {
    return value.getTime() + "";
  } else {
    return value as any;
  }
}

function compareValues(a, b) {
  // treat null and undefined as equal
  a = a === null ? undefined : a;
  b = b === null ? undefined : b;

  if (a === b) {
    return 0;
  } else if (a === undefined) {
    // sort `undefined` to the end for ascending order
    return 1;
  } else if (typeof a === "number" && typeof b === "number") {
    return a - b;
  } else {
    // Fallback to localeCompare for strings for any types that don't have a special comparison
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  }
}
