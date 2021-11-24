import { TestBed } from "@angular/core/testing";

import { ChildrenMigrationService } from "./children-migration.service";
import { Database } from "../../../core/database/database";
import { PouchDatabase } from "../../../core/database/pouch-database";
import { Child } from "../model/child";

describe("ChildrenMigrationService", () => {
  let service: ChildrenMigrationService;
  let database: PouchDatabase;

  beforeEach(() => {
    database = new PouchDatabase().initInMemoryDB();
    TestBed.configureTestingModule({
      providers: [{ provide: Database, useValue: database }],
    });
    service = TestBed.inject(ChildrenMigrationService);
  });

  afterEach(async () => {
    await database.destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should migrate children with old format", async () => {
    await database.put({
      _id: `${Child.ENTITY_TYPE}:firstChild`,
      photoFile: "oldFile1.jpg",
    });
    await database.put({
      _id: `${Child.ENTITY_TYPE}:secondChild`,
      photoFile: "oldFile2.jpg",
    });
    await database.put({
      _id: `${Child.ENTITY_TYPE}:thirdChild`,
      photo: "newFormat.jpg",
    });

    await service.migratePhotoFormat();

    const firstChild = await database.get(`${Child.ENTITY_TYPE}:firstChild`);
    expect(firstChild["photo"]).toEqual("oldFile1.jpg");
    const secondChild = await database.get(`${Child.ENTITY_TYPE}:secondChild`);
    expect(secondChild["photo"]).toEqual("oldFile2.jpg");
    const thirdChild = await database.get(`${Child.ENTITY_TYPE}:thirdChild`);
    expect(thirdChild["photo"]).toEqual("newFormat.jpg");
  });
});
