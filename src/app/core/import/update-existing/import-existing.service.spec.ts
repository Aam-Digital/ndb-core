import { TestBed } from "@angular/core/testing";

import { ImportService } from "../import.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { Entity } from "../../entity/model/entity";
import { ImportSettings } from "../import-metadata";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { expectEntitiesToBeInDatabase } from "../../../utils/expect-entity-data.spec";
import { DateWithAge } from "../../basic-datatypes/date-with-age/dateWithAge";
import { genders } from "../../../child-dev-project/children/model/genders";

describe("ImportExistingService", () => {
  let service: ImportService;

  let entityMapper: EntityMapperService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [ImportService],
    });
    service = TestBed.inject(ImportService);

    entityMapper = TestBed.inject(EntityMapperService);
  });

  it("should use existing records to be updated, if matchExistingByFields are given", async () => {
    const existingRecords: Entity[] = [
      TestEntity.create({
        name: "A",
        other: "old value",
        category: genders[1],
        ref: "existing_link",
        _rev: "A1",
      }),
      TestEntity.create({
        name: "B",
        _rev: "B1",
      }),
      TestEntity.create({
        name: "C",
        category: genders[2],
        _rev: "C1",
      }),
      TestEntity.create({ name: "X", _rev: "X1" }),
    ];
    await entityMapper.saveAll(existingRecords);

    const rawData: any[] = [
      {
        d: "match existing",
        rawName: "A",
        category: "M1",
        other: "new value",
      },
      {
        d: "match part, mismatch part",
        rawName: "A2",
        category: "M1",
      },
      { d: "match part", rawName: "B", category: "O1" },
      { d: "match part", rawName: "C" },
      { d: "not matching", rawName: "XXX" },
    ];
    const importSettings: ImportSettings = {
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        { column: "rawName", propertyName: "name" },
        {
          column: "category",
          propertyName: "category",
          additional: {
            M1: genders[1].id,
            M2: genders[2].id,
            O1: "O1",
          },
        },
        { column: "other", propertyName: "other" },
      ],
      matchExistingByFields: ["name", "category"],
    };

    const parsedEntities = await service.transformRawDataToEntities(
      rawData,
      importSettings,
    );

    let expectedEntities: any[] = [
      {
        _rev: existingRecords[0]["_rev"], // matched by name AND category (both have values)
        _id: existingRecords[0]["_id"],
        name: "A",
        category: genders[1].id,
        other: "new value", // updated
        ref: "existing_link", // not touched from existing entity
      },
      {
        _id: jasmine.any(String), // not matched
        name: "A2",
        category: genders[1].id,
      },
      {
        _id: jasmine.any(String), // not matched (existing B has no category, so can't match)
        name: "B",
        category: "O1",
      },
      {
        _id: jasmine.any(String), // not matched (import row C has no category, so can't match)
        name: "C",
      },
      {
        _id: jasmine.any(String), // not matched
        name: "XXX",
      },
    ];

    expect(parsedEntities.length).toBe(expectedEntities.length);
    parsedEntities
      .filter((e) => e["category"])
      .forEach((e: Entity) => {
        e["category"] = e["category"].id;
      });
    for (const expected of expectedEntities) {
      expect(parsedEntities).toContain(jasmine.objectContaining(expected));
    }
  });

  it("should not delete records during undo if they were updated during import and existed before", async () => {
    const oldGender = genders[1];
    const overwrittenGender = genders[2];
    const existingEntity = TestEntity.create({
      name: "Existing",
      other: "old value",
      category: oldGender,
      dateOfBirth: new DateWithAge("2000-01-01"),
      _rev: "rev-1", // simulate already existing entity
    });
    const unrelatedEntity = TestEntity.create({ name: "Unrelated" });
    await entityMapper.saveAll([existingEntity, unrelatedEntity]);

    const dataToImport = [
      {
        name: existingEntity.name,
        other: "overwritten value",
        category: overwrittenGender.id,
      },
      { name: "New Created Entity" },
    ];
    const importSettings: ImportSettings = {
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        { column: "name", propertyName: "name" },
        { column: "other", propertyName: "other" },
        {
          column: "category",
          propertyName: "category",
          additional: { [overwrittenGender.id]: overwrittenGender.id },
        },
        { column: "dateOfBirth", propertyName: "dateOfBirth" },
      ],
      matchExistingByFields: ["name"],
    };

    const entitiesToImport = await service.transformRawDataToEntities(
      dataToImport,
      importSettings,
    );
    const importMetadata = await service.executeImport(
      entitiesToImport,
      importSettings,
    );

    // simulate this being stored in an actual DB (to test some comparison by reference issues)
    importMetadata.updatedEntities = JSON.parse(
      JSON.stringify(importMetadata.updatedEntities),
    );

    await service.undoImport(importMetadata);

    await expectEntitiesToBeInDatabase(
      [
        unrelatedEntity,
        TestEntity.create({
          name: "Existing",
          other: "old value",
          category: oldGender,
          dateOfBirth: existingEntity.dateOfBirth,
        }),
      ],
      true,
      true,
    );
  });

  it("should ignore fields where both imported and existing values are empty when matching", async () => {
    // Setup: Create existing records with various combinations of empty and non-empty fields
    const existingRecords: Entity[] = [
      TestEntity.create({
        name: "Person A",
        other: "", // empty field
        category: genders[1],
        _rev: "A1",
      }),
      TestEntity.create({
        name: "Person B",
        other: "some value",
        category: undefined, // empty field
        _rev: "B1",
      }),
      TestEntity.create({
        name: "Person C",
        other: null, // empty field
        category: null, // empty field
        _rev: "C1",
      }),
    ];
    await entityMapper.saveAll(existingRecords);

    // Import data with corresponding empty fields
    const rawData: any[] = [
      {
        // Should match Person A: name + category match, both "other" fields are empty (should be ignored)
        rawName: "Person A",
        category: "M1",
        other: "", // empty - should be ignored for matching
      },
      {
        // Should match Person B: name + other match, both "category" fields are empty (should be ignored)
        rawName: "Person B",
        other: "some value",
        category: "", // empty - should be ignored for matching
      },
      {
        // Should match Person C: name matches, both "other" and "category" are empty (should be ignored)
        rawName: "Person C",
        other: null,
        category: undefined,
      },
      {
        // Should NOT match: name doesn't exist
        rawName: "Person D",
        other: "",
        category: "",
      },
    ];

    const importSettings: ImportSettings = {
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        { column: "rawName", propertyName: "name" },
        {
          column: "category",
          propertyName: "category",
          additional: {
            M1: genders[1].id,
          },
        },
        { column: "other", propertyName: "other" },
      ],
      matchExistingByFields: ["name", "category", "other"],
    };

    const parsedEntities = await service.transformRawDataToEntities(
      rawData,
      importSettings,
    );

    // Verify matches
    const expectedEntities: any[] = [
      {
        _id: existingRecords[0]["_id"], // matched Person A
        _rev: existingRecords[0]["_rev"],
        name: "Person A",
        category: genders[1].id,
        // Note: other becomes undefined after import transformation (empty string → undefined)
      },
      {
        _id: existingRecords[1]["_id"], // matched Person B
        _rev: existingRecords[1]["_rev"],
        name: "Person B",
        other: "some value",
      },
      {
        _id: existingRecords[2]["_id"], // matched Person C
        _rev: existingRecords[2]["_rev"],
        name: "Person C",
        // Note: both other and category become undefined after import transformation
      },
      {
        _id: jasmine.any(String), // not matched - new entity
        name: "Person D",
        // Note: empty strings become undefined after import transformation
      },
    ];

    expect(parsedEntities.length).toBe(expectedEntities.length);
    parsedEntities
      .filter((e) => e["category"])
      .forEach((e: Entity) => {
        e["category"] = e["category"].id;
      });
    for (const expected of expectedEntities) {
      expect(parsedEntities).toContain(jasmine.objectContaining(expected));
    }
  });

  it("should not match when all matching fields are empty in both imported and existing entity", async () => {
    // Edge case: if ALL matching fields are empty on both sides, don't match
    // (we require at least one non-empty field to actually match)
    const existingRecords: Entity[] = [
      TestEntity.create({
        name: "Person E",
        other: "",
        category: undefined,
        _rev: "E1",
      }),
    ];
    await entityMapper.saveAll(existingRecords);

    const rawData: any[] = [
      {
        // Should NOT match: all matching fields are empty
        rawName: "Person E",
        other: "",
        category: "",
      },
    ];

    const importSettings: ImportSettings = {
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        { column: "rawName", propertyName: "name" },
        { column: "category", propertyName: "category" },
        { column: "other", propertyName: "other" },
      ],
      matchExistingByFields: ["other", "category"], // only empty fields
    };

    const parsedEntities = await service.transformRawDataToEntities(
      rawData,
      importSettings,
    );

    // Should be a new entity since all matching fields were empty
    expect(parsedEntities.length).toBe(1);
    expect(parsedEntities[0].getId()).not.toBe(existingRecords[0].getId());
    expect(parsedEntities[0]._rev).toBeUndefined();
  });
});
