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
export function groupBy<T>(
  array: T[],
  propertyToGroupBy: keyof T
): Map<string, T[]> {
  return array.reduce(
    (entryMap, element) =>
      entryMap.set(element[propertyToGroupBy], [
        ...(entryMap.get(element[propertyToGroupBy]) || []),
        element,
      ]),
    new Map()
  );
}
