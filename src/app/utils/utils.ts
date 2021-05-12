/**
 * Checks if the given value is an instance of Date and holds a valid date value.
 * @param date The date to be checked
 */
import { Router } from "@angular/router";

export function isValidDate(date: any): boolean {
  return (
    date &&
    Object.prototype.toString.call(date) === "[object Date]" &&
    !Number.isNaN(date.getTime())
  );
}

export function getUrlWithoutParams(router: Router): string {
  const urlTree = router.parseUrl(router.url);
  urlTree.queryParams = {};
  return urlTree.toString();
}

export function getParentUrl(router: Router): string {
  const url = getUrlWithoutParams(router);
  return url.substr(0, url.lastIndexOf("/"));
}

/**
 * Group an array by the given property into a map of parts of the array.
 *
 * @param array A simple array to be grouped.
 * @param propertyToGroupBy The key of the property in the elements by whose value the result is grouped.
 */
export function groupBy<ENTITY, PROPERTY extends keyof ENTITY>(
  array: ENTITY[],
  propertyToGroupBy: PROPERTY
): Map<ENTITY[PROPERTY], ENTITY[]> {
  return array.reduce(
    (entryMap, element) =>
      entryMap.set(element[propertyToGroupBy], [
        ...(entryMap.get(element[propertyToGroupBy]) || []),
        element,
      ]),
    new Map<ENTITY[PROPERTY], ENTITY[]>()
  );
}

export function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export function sortByAttribute<OBJECT, PROPERTY extends keyof OBJECT>(
  attribute: PROPERTY,
  order: "asc" | "desc" = "asc"
): (e1: OBJECT, e2: OBJECT) => number {
  return (e1, e2) => {
    const value1 = e1[attribute];
    const value2 = e2[attribute];
    if (value1 === value2) {
      return 0;
    } else if (value1 < value2) {
      return order === "asc" ? -1 : 1;
    } else {
      return order === "asc" ? 1 : -1;
    }
  };
}
