import { TestBed } from "@angular/core/testing";
import { EntitySchemaService } from "../core/entity/schema/entity-schema.service";
import { Entity } from "../core/entity/model/entity";
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

  for (let i = 0; i < cleanExpected.length; i++) {
    const data = cleanExpected[i];
    expect(cleanActual).toContain(
      data,
      "expected object not found: index " + i
    );
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
    const result =
      TestBed.inject(EntitySchemaService).transformEntityToDatabaseFormat(obj);

    delete result._rev;
    delete result.searchIndices;
    if (withoutId) {
      delete result._id;
    }
    return result;
  }
}
