import { entityListSortingAccessor } from "./sorting-accessor";

export function tableSort<OBJECT, PROPERTY extends keyof OBJECT>(
  data: OBJECT[],
  {
    direction,
    active,
  }: { direction: "asc" | "desc" | ""; active: PROPERTY | "" }
): OBJECT[] {
  if (direction === "" || !active) {
    return data;
  }
  data.sort((a, b) => {
    const aString = getComparableString(a, active);
    const bString = getComparableString(b, active);
    return compareStrings(aString, bString);
  });
  if (direction === "desc") {
    data.reverse();
  }
  return data;
}

function getComparableString<OBJECT, PROPERTY extends keyof OBJECT>(
  obj: OBJECT,
  key: PROPERTY
): OBJECT[PROPERTY] | string {
  const value = entityListSortingAccessor(obj, key) as OBJECT[PROPERTY];
  if (value instanceof Date) {
    return value.getTime() + "";
  } else if (typeof value === "number") {
    return value + "";
  } else {
    return value;
  }
}

function compareStrings(aString: any, bString: any) {
  // Handle null values
  if (aString === bString) {
    return 0;
  } else if (aString === null || aString === undefined) {
    return 1;
  } else if (bString === null || bString === undefined) {
    return -1;
  } else if (typeof aString === "string" && typeof bString === "string") {
    return aString.localeCompare(bString, undefined, { numeric: true });
  } else if (aString > bString) {
    return -1;
  } else if (aString < bString) {
    return 1;
  } else {
    return 0;
  }
}
