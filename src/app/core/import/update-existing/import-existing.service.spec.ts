import { TestBed } from "@angular/core/testing";

import { ImportService } from "../import.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { Entity } from "../../entity/model/entity";
import { ImportSettings } from "../import-metadata";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { expectEntitiesToBeInDatabase } from "../../../utils/expect-entity-data.spec";
import { DateWithAge } from "../../basic-datatypes/date-with-age/dateWithAge";
import { genders } from "../../../child-dev-project/children/model/genders";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";

describe("ImportExistingService", () => {
  let service: ImportService;

  let entityMapper: EntityMapperService;

  beforeEach(async () => {
    entityMapper = mockEntityMapper();

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        ImportService,
        { provide: EntityMapperService, useValue: entityMapper },
        {
          provide: ConfigurableEnumService,
          useValue: new ConfigurableEnumService(
            entityMapper,
            jasmine.createSpyObj(["can"]),
          ),
        },
      ],
    });
    service = TestBed.inject(ImportService);
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
        _rev: existingRecords[0]["_rev"], // matched by name + dateOfBirth
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
        _rev: existingRecords[1]["_rev"], // matched by name, entity missing dateOfBirth
        _id: existingRecords[1]["_id"],
        name: "B",
        category: "O1",
      },
      {
        _rev: existingRecords[2]["_rev"], // matched by name, imported row missing dateOfBirth
        _id: existingRecords[2]["_id"],
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
});
