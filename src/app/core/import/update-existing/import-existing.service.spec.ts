import { TestBed } from "@angular/core/testing";

import { ImportExistingService } from "./import-existing.service";
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

  it("should use existing records to be updated, if idFields are given", async () => {
    const existingRecords: Entity[] = [
      TestEntity.create({
        name: "A",
        dateOfBirth: new DateWithAge("2000-01-01"),
        other: "old value",
        category: { id: "X", label: "X" },
        _rev: "A1",
      }),
      TestEntity.create({
        name: "B",
        _rev: "B1",
      }),
      TestEntity.create({
        name: "C",
        dateOfBirth: new DateWithAge("2000-03-03"),
        _rev: "C1",
      }),
      TestEntity.create({ name: "X", _rev: "X1" }),
    ];
    await entityMapper.saveAll(existingRecords);

    const rawData: any[] = [
      {
        d: "match existing",
        rawName: "A",
        DoB: "2000-01-01",
        other: "new value",
      },
      {
        d: "match part, mismatch part",
        rawName: "A2",
        DoB: "2000-01-01",
      },
      { d: "match part", rawName: "B", DoB: "2022-12-31" },
      { d: "match part", rawName: "C" },
      { d: "not matching", rawName: "XXX" },
    ];
    const importSettings: ImportSettings = {
      entityType: TestEntity.ENTITY_TYPE,
      columnMapping: [
        { column: "rawName", propertyName: "name" },
        { column: "DoB", propertyName: "dateOfBirth" },
        { column: "other", propertyName: "other" },
      ],
      idFields: ["name", "dateOfBirth"],
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
        dateOfBirth: parsedEntities[0]["dateOfBirth"],
        other: "new value", // updated
        category: { id: "X", label: "X" }, // not touched from existing entity
      },
      {
        _id: jasmine.any(String), // not matched
        name: "A2",
        dateOfBirth: parsedEntities[1]["dateOfBirth"],
      },
      {
        _rev: existingRecords[1]["_rev"], // matched by name, entity missing dateOfBirth
        _id: existingRecords[1]["_id"],
        name: "B",
        dateOfBirth: parsedEntities[2]["dateOfBirth"],
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
      idFields: ["name"],
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
