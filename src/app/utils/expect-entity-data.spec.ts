import { TestBed } from "@angular/core/testing";
import { EntitySchemaService } from "../core/entity/schema/entity-schema.service";
import { Entity } from "../core/entity/entity";
import { EntityMapperService } from "../core/entity/entity-mapper.service";

/**
 * Run unit test expect to check that all given entities are indeed in the database.
 * @param expectedEntities array of expected Entity instances to be checked in the database
 * @param onlyExpected (Optional) if set to true, ensure that the expected entities are the only entities of that type in the database
 * @param ignoreId do not compare _id of entities, match only based on properties
 */
export async function expectEntitiesToBeInDatabase(
  expectedEntities: Entity[],
  ignoreId: boolean = false,
  onlyExpected: boolean = false
) {
  const entityMapperService = TestBed.inject(EntityMapperService);
  const actualData = await entityMapperService.loadType(
    expectedEntities[0].getConstructor()
  );

  expectEntitiesToMatch(actualData, expectedEntities, ignoreId, onlyExpected);
}

/**
 * Run unit test expect to compare the given sets of entities while ignoring technical properties
 * @param actualEntities array of actual Entity instances to be compared
 * @param expectedEntities array of expected Entity instances to be compared
 * @param ignoreId do not compare _id of entities, match only based on properties
 * @param onlyExpected (Optional) if set to true, ensure that the expected entities are the only entities of that type in the database
 */
export function expectEntitiesToMatch(
  actualEntities: any[],
  expectedEntities: Entity[],
  ignoreId: boolean = false,
  onlyExpected: boolean = true
) {
  if (onlyExpected) {
    expect(actualEntities.length).toBe(expectedEntities.length);
  }

  const cleanExpected = comparableEntityData(expectedEntities, ignoreId);
  const cleanActual = comparableEntityData(actualEntities, ignoreId);

  // write arrays to console for easier debugging of complex mismatching objects
  console.log("expected objects", cleanExpected);
  console.log("actual objects", cleanActual);
  console.log("Differences:");
  printDifferences("entities", cleanExpected, cleanActual);

  for (let i = 0; i < cleanExpected.length; i++) {
    const data = cleanExpected[i];
    expect(cleanActual).toContain(
      data,
      "expected object not found: index " + i
    );
  }
}

/**
 * Prints the differences between `p1` ands `p2`
 * These can be anything, recursive checks for objects and arrays
 * will be made.
 * <br>
 * This will <em>only</em> print the differences between the two
 * elements. If the elements (or contents of the elements) are the same,
 * this will print nothing. For example considering the two objects:
 * ```json
 * {
 *   "person": {
 *     "name": "A",
 *     "age": 23
 *   }
 * }
 * ```
 * and
 * ```json
 * {
 *   "person": {
 *     "name": "A",
 *     "age": 25
 *   }
 * }
 * ```
 *
 * this method would print "Attribute object.person.age is not
 * the same: Expected '23' but got '25'"
 * @param name The name of the element
 * @param p1 The first element to check
 * @param p2 The second element to check
 */
function printDifferences(name: string, p1: any, p2: any) {
  if (isNotSameType(name, p1, p2)) {
    return;
  }
  if (Array.isArray(p1)) {
    printArrayDifferences(name, p1, p2);
  } else if (typeof p1 === "object") {
    printObjectDifferences(name, p1, p2);
  } else {
    printPrimitiveDifferences(name, p1, p2);
  }
}

function printPrimitiveDifferences(name: string, p1: any, p2: any) {
  if (p1 !== p2) {
    console.error(
      `Attribute ${name} is not the same: Expected '${p1}' but got '${p2}'`
    );
  }
}

function isNotSameType(name: string, p1: any, p2: any): boolean {
  if (typeof p1 !== typeof p2) {
    console.error(
      `Expected attribute ${name} to be of type '${typeof p1}', but it is '${typeof p2}'`
    );
    console.error(`Want:${p1}, got: ${p2}`);
    return false;
  }
  return true;
}

function printObjectDifferences(name: string, obj1: object, obj2: object) {
  for (const attr in obj1) {
    if (!obj1.hasOwnProperty(attr)) {
      continue;
    }
    if (obj2.hasOwnProperty(attr)) {
      const p1 = obj1[attr];
      const p2 = obj2[attr];
      printDifferences(name + "." + attr, p1, p2);
    } else {
      console.error(`${name} is missing the property '${attr}'`);
    }
  }
}

function printArrayDifferences(name: string, a1: Array<any>, a2: Array<any>) {
  if (a1.length !== a2.length) {
    console.log(
      `Attribute ${name}: Expected length: ${a1.length} is not ${a2.length}`
    );
  } else {
    for (let i = 0; i < a1.length; ++i) {
      printDifferences(`${name}[${i}]`, a1[i], a2[i]);
    }
  }
}

/**
 * Transform the given objects to remove technical properties in order to allow a comparison/matching in tests.
 * @param obj The object or array of objects to simplify
 * @param withoutId (Optional) set to true to remove _id as well
 */
function comparableEntityData(obj: any | any[], withoutId: boolean = false) {
  if (Array.isArray(obj)) {
    return obj.map((o) => comparableEntityData(o, withoutId));
  } else {
    const result = TestBed.inject(
      EntitySchemaService
    ).transformEntityToDatabaseFormat(obj);

    delete result._rev;
    delete result.searchIndices;
    if (withoutId) {
      delete result._id;
    }
    return result;
  }
}
