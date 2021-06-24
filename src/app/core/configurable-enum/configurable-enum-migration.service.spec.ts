import { TestBed } from "@angular/core/testing";

import { ConfigurableEnumMigrationService } from "./configurable-enum-migration.service";
import { PouchDatabase } from "../database/pouch-database";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { Database } from "../database/database";
import { ConfigurableEnumModule } from "./configurable-enum.module";

describe("ConfigurableEnumMigrationService", () => {
  let service: ConfigurableEnumMigrationService;
  let database: PouchDatabase;

  beforeEach(() => {
    database = PouchDatabase.createWithInMemoryDB();
    TestBed.configureTestingModule({
      imports: [ConfigurableEnumModule],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useValue: database },
      ],
    });
    service = TestBed.inject(ConfigurableEnumMigrationService);
  });

  afterEach(async () => {
    await database.destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should migrate aser entities", async () => {
    const oldAser = {
      _id: "Aser:1",
      child: "childId",
      date: new Date(),
      hindi: "Nothing",
      bengali: "Read Letters",
      english: "Read Words",
      math: "Numbers 1-9",
      remarks: "some remarks",
    };
    await database.put(oldAser);

    await service.migrateSelectionsToConfigurableEnum();
    const newAser = await database.get("Aser:1");

    expect(newAser["child"]).toBe(oldAser.child);
    expect(newAser["hindi"]).toBe("nothing");
    expect(newAser["bengali"]).toBe("read_letters");
    expect(newAser["english"]).toBe("read_words");
    expect(newAser["math"]).toBe("numbers1to9");
    expect(new Date(newAser["date"])).toEqual(oldAser.date);
    expect(newAser["remarks"]).toBe(oldAser.remarks);
  });

  it("should migrate education material entities", async () => {
    const oldMaterial = {
      _id: "EducationalMaterial:1",
      child: "childId",
      date: new Date(),
      materialType: "pen (black)",
      materialAmount: 2,
      description: "some description",
    };
    await database.put(oldMaterial);

    await service.migrateSelectionsToConfigurableEnum();
    const newMaterial = await database.get("EducationalMaterial:1");

    expect(newMaterial["child"]).toBe(oldMaterial.child);
    expect(new Date(newMaterial["date"])).toEqual(oldMaterial.date);
    expect(newMaterial["materialType"]).toBe("pen_black");
    expect(newMaterial["materialAmount"]).toBe(oldMaterial.materialAmount);
    expect(newMaterial["description"]).toBe(oldMaterial.description);
  });
});
