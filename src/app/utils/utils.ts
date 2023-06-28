/**
 * Checks if the given value is an instance of Date and holds a valid date value.
 * @param date The date to be checked
 */
import { Router } from "@angular/router";
import { ConfigurableEnumValue } from "../core/configurable-enum/configurable-enum.interface";
import { FactoryProvider, Injector } from "@angular/core";
import { isConfigurableEnum } from "../core/entity-components/entity-subrecord/entity-subrecord/value-accessor";

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
  return url.substring(0, url.lastIndexOf("/"));
}

/**
 * Group an array by the given property.
 *
 * @param array A simple array to be grouped.
 * @param propertyToGroupBy The key of the property in the elements by whose value the result is grouped.
 * @returns an array where the first entry is the value of this group and the second all entries that have this value.
 */
export function groupBy<T, P extends keyof T>(
  array: T[],
  propertyToGroupBy: P
): [T[P], T[]][] {
  return array.reduce((allGroups, currentElement) => {
    const currentValue = currentElement[propertyToGroupBy];
    let existingGroup = allGroups.find(([group]) =>
      equals(group, currentValue)
    );
    if (!existingGroup) {
      existingGroup = [currentValue, []];
      allGroups.push(existingGroup);
    }
    existingGroup[1].push(currentElement);
    return allGroups;
  }, new Array<[T[P], T[]]>());
}

/**
 * Comparing two values for equality that might be different than just object equality
 * @param a
 * @param b
 */
function equals(a, b): boolean {
  if (isConfigurableEnum(a) && isConfigurableEnum(b)) {
    return a.id === b.id;
  } else {
    return a === b;
  }
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

export function compareEnums(
  a: ConfigurableEnumValue,
  b: ConfigurableEnumValue
): boolean {
  return a?.id === b?.id;
}

/**
 * Parses and returns the payload of a JWT into a JSON object.
 * For me info see {@link https://jwt.io}.
 * @param token a valid JWT
 */
export function parseJwt(token): {
  sub: string;
  username: string;
  sid: string;
  jti: string;
} {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(jsonPayload);
}

/**
 * This is a simple shorthand function to create factories for services.
 * The use case is, when multiple services extends the same class and one of these services will be provided.
 * @param service the token for which a service is provided
 * @param factory factory which returns a subtype of class
 */
export function serviceProvider<T>(
  // Allow abstract or normal classes as first argument
  service: { prototype: T } | { new (...args: any[]): T },
  factory: (injector: Injector) => T
): FactoryProvider {
  return {
    provide: service,
    useFactory: factory,
    deps: [Injector],
  };
}