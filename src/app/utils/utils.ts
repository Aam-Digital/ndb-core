/**
 * Checks if the given value is an instance of Date and holds a valid date value.
 * @param date The date to be checked
 */
import { MessageId, TargetMessage } from "@angular/localize";
import { Router } from "@angular/router";
import xliff from "xliff";
import { ConfigurableEnumValue } from "../core/configurable-enum/configurable-enum.interface";

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

export function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export function sortByAttribute<OBJECT>(
  attribute: keyof OBJECT,
  order: "asc" | "desc" = "asc"
): (e1: OBJECT, e2: OBJECT) => number {
  return (e1, e2) => {
    const value1 = e1[attribute];
    const value2 = e2[attribute];
    if (value1 === value2) {
      return 0;
    }

    // treat undefined specifically as greatest value (otherwise they remain stuck at their original position)
    if (value1 === undefined) {
      return order === "asc" ? 1 : -1;
    }
    if (value2 === undefined) {
      return order === "asc" ? -1 : 1;
    }

    if (value1 < value2) {
      return order === "asc" ? -1 : 1;
    } else {
      return order === "asc" ? 1 : -1;
    }
  };
}

export function readFile(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () =>
      resolve(fileReader.result as string)
    );
    fileReader.readAsText(file);
  });
}

export async function parseTranslationsForLocalize(
  translations: string
): Promise<Record<MessageId, TargetMessage>> {
  const parserResult: any = await xliff.xliff12ToJs(translations);
  const xliffContent: any = parserResult.resources["ng2.template"];

  return Object.keys(xliffContent).reduce(
    (result: Record<MessageId, TargetMessage>, current: string) => {
      const translation = xliffContent[current].target;
      if (typeof translation === "string") {
        result[current] = translation;
      } else if (Array.isArray(translation)) {
        result[current] = translation
          .map((entry) =>
            typeof entry === "string" ? entry : `{{${entry.Standalone.id}}}`
          )
          .map((entry: string) => entry.replace("{{", "{$").replace("}}", "}"))
          .join("");
      } else {
        console.warn("this is probably an error", xliffContent[current]);
        result[current] = translation.Standalone["equiv-text"];
      }
      return result;
    },
    {}
  );
}

export function compareEnums(
  a: ConfigurableEnumValue,
  b: ConfigurableEnumValue
): boolean {
  return a?.id === b?.id;
}
