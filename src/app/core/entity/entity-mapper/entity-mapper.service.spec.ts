/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { EntityMapperService } from "./entity-mapper.service";
import { Entity } from "../model/entity";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { PouchDatabase } from "../../database/pouchdb/pouch-database";
import { DatabaseEntity } from "../database-entity.decorator";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { MemoryPouchDatabase } from "../../database/pouchdb/memory-pouch-database";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { SyncStateSubject } from "app/core/session/session-type";
import { DatabaseFactoryService } from "../../database/database-factory.service";

describe("EntityMapperService", () => {
  let entityMapper: EntityMapperService;
  let testDatabase: PouchDatabase;

  const existingEntity = {
    _id: "Entity:existing-entity",
    label: "entity from database",
  };

  const existingEntity2 = {
    _id: "Entity:existing-entity2",
    label: "entity 2 from database",
  };

  beforeEach(waitForAsync(() => {
    const syncStateSubject = new SyncStateSubject();
    let dbFactory = jasmine.createSpyObj(["createDatabase"]);
    dbFactory.createDatabase.and.callFake((dbName) => {
      const db = new MemoryPouchDatabase(dbName, syncStateSubject);
      db.init();
      return db;
    });

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        DatabaseResolverService,
        { provide: DatabaseFactoryService, useValue: dbFactory },
        CurrentUserSubject,
        EntityMapperService,
      ],
    });
    entityMapper = TestBed.inject(EntityMapperService);

    testDatabase = TestBed.inject(
      DatabaseResolverService,
    ).getDatabase() as MemoryPouchDatabase;

    return Promise.all([
      testDatabase.put(existingEntity),
      testDatabase.put(existingEntity2),
    ]);
  }));

  afterEach(async () => {
    await testDatabase.destroy();
  });

  function expectEntity(actualEntity, expectedEntity) {
    expect(actualEntity.getId()).toBe(expectedEntity._id);
    expect(actualEntity).toBeInstanceOf(Entity);
  }

  it("loads existing entity", async () => {
    const loadedEntity = await entityMapper.load<Entity>(
      Entity,
      existingEntity._id,
    );
    expectEntity(loadedEntity, existingEntity);
  });

  it("load multiple entities", async () => {
    const loadedEntities = await entityMapper.loadType<Entity>(Entity);
    expect(loadedEntities).toHaveSize(2);

    const entity1 = loadedEntities[0];
    const entity2 = loadedEntities[1];

    expectEntity(entity1, existingEntity);
    expectEntity(entity2, existingEntity2);
  });

  it("rejects promise when loading nonexistent entity", async () => {
    return entityMapper.load<Entity>(Entity, "nonexistent_id").catch((err) => {
      expect(err).withContext('"not found" error not defined').toBeDefined();
    });
  });

  it("returns empty array when loading non existing entity type ", async () => {
    class TempTestEntity extends Entity {
      static override ENTITY_TYPE = "TestEntity";
    }

    const result = await entityMapper.loadType<TempTestEntity>(TempTestEntity);
    expect(result).toBeEmpty();
  });

  it("saves new entity and loads it", async () => {
    const entity = new Entity("test1");

    await entityMapper.save(entity);
    const loadedEntity = await entityMapper.load(Entity, entity.getId());
    expectEntity(loadedEntity, entity);
  });

  it("rejects promise when saving new entity with existing entityId", async () => {
    const duplicateEntity = new Entity(existingEntity._id);

    await entityMapper
      .save<Entity>(duplicateEntity)
      .then(() => {
        fail("unexpectedly succeeded to overwrite existing entity");
      })
      .catch(function (error) {
        expect(error).toBeDefined();
      });
  });

  it("saves new version of existing entity", async () => {
    const loadedEntity = await entityMapper.load(Entity, existingEntity._id);
    expect(loadedEntity.getId()).toEqual(existingEntity._id);

    await entityMapper.save<Entity>(loadedEntity);
  });

  it("removes existing entity", async () => {
    const loadedEntity = await entityMapper.load(Entity, existingEntity._id);
    await entityMapper.remove<Entity>(loadedEntity);

    await expectAsync(
      entityMapper.load(Entity, existingEntity._id),
    ).toBeRejected();
  });

  it("rejects promise removing nonexistent entity", () => {
    const nonexistingEntity = new Entity("nonexistent-entity");

    return entityMapper
      .remove<Entity>(nonexistingEntity)
      .then(() => fail("unexpectedly resolved promise"))
      .catch((error) => {
        expect(error).toBeDefined();
      });
  });

  it("loads entity for id given with and without prefix", async () => {
    const testId = "t1";
    const testEntity = new Entity(testId);
    await entityMapper.save(testEntity);

    const loadedByShortId = await entityMapper.load(
      Entity,
      testEntity.getId(true),
    );
    expect(loadedByShortId).toBeDefined();
    expect(loadedByShortId.getId().startsWith(Entity.ENTITY_TYPE)).toBeTrue();

    const loadedByFullId = await entityMapper.load(
      Entity,
      loadedByShortId.getId(),
    );
    expect(loadedByFullId.getId()).toBe(loadedByShortId.getId());
    expect(loadedByFullId._rev).toBe(loadedByShortId._rev);
  });

  it("publishes updates to any listeners", () => {
    const testId = "Entity:t1";
    const testEntity = new Entity(testId);
    entityMapper
      .save(testEntity, true)
      .then(() => entityMapper.remove(testEntity));

    return receiveUpdatesAndTestTypeAndId(undefined, testId);
  });

  it("publishes when an existing entity is updated", () => {
    entityMapper
      .load(Entity, existingEntity._id)
      .then((loadedEntity) => entityMapper.save(loadedEntity));

    return receiveUpdatesAndTestTypeAndId("update", existingEntity._id);
  });

  it("publishes when an existing entity is deleted", () => {
    entityMapper
      .load(Entity, existingEntity._id)
      .then((loadedEntity) => entityMapper.remove(loadedEntity));

    return receiveUpdatesAndTestTypeAndId("remove", existingEntity._id);
  });

  it("publishes when a new entity is being saved", () => {
    const testId = "Entity:t1";
    const testEntity = new Entity(testId);
    entityMapper.save(testEntity, true);

    return receiveUpdatesAndTestTypeAndId("new", testId);
  });

  it("correctly behaves when en empty array is given to the saveAll function", async () => {
    const result = await entityMapper.saveAll([]);
    expect(result).toHaveSize(0);
  });

  it("correctly saves an array of heterogeneous entities", async () => {
    const result = await entityMapper.saveAll([
      new MockEntityA("1"),
      new MockEntityA("10"),
      new MockEntityA("42"),
    ]);
    expect(result).toEqual([
      jasmine.objectContaining({
        ok: true,
        id: "EntityA:1",
      }),
      jasmine.objectContaining({
        ok: true,
        id: "EntityA:10",
      }),
      jasmine.objectContaining({
        ok: true,
        id: "EntityA:42",
      }),
    ]);
  });

  it("correctly saves an array of homogeneous entities", async () => {
    const result = await entityMapper.saveAll([
      new MockEntityA("1"),
      new MockEntityB("10"),
      new MockEntityA("42"),
    ]);
    expect(result).toEqual([
      jasmine.objectContaining({
        ok: true,
        id: "EntityA:1",
      }),
      jasmine.objectContaining({
        ok: true,
        id: "EntityB:10",
      }),
      jasmine.objectContaining({
        ok: true,
        id: "EntityA:42",
      }),
    ]);
  });

  it("sets the entityCreated property on save if it is a new entity & entityUpdated on subsequent saves", async () => {
    jasmine.clock().install();
    const currentUser = new Entity(TEST_USER);
    TestBed.inject(CurrentUserSubject).next(currentUser);
    const id = "test_created";
    const entity = new Entity(id);

    const mockTime1 = 1;
    jasmine.clock().mockDate(new Date(mockTime1));
    await entityMapper.save(entity);
    const createdEntity = await entityMapper.load(Entity, id);

    expect(createdEntity.created?.at.getTime()).toEqual(mockTime1);
    expect(createdEntity.created?.by).toEqual(currentUser.getId());
    expect(createdEntity.updated?.at.getTime()).toEqual(mockTime1);
    expect(createdEntity.updated?.by).toEqual(currentUser.getId());

    const mockTime2 = mockTime1 + 1;
    jasmine.clock().mockDate(new Date(mockTime2));
    await entityMapper.save<Entity>(createdEntity);
    const updatedEntity = await entityMapper.load<Entity>(Entity, id);

    expect(updatedEntity.created?.at.getTime()).toEqual(mockTime1);
    expect(updatedEntity.updated?.at.getTime()).toEqual(mockTime2);

    jasmine.clock().uninstall();
  });

  function receiveUpdatesAndTestTypeAndId(type?: string, entityId?: string) {
    return new Promise<void>((resolve) => {
      entityMapper.receiveUpdates(Entity).subscribe((e) => {
        if (e) {
          if (type) {
            expect(e.type).toBe(type);
          }
          if (entityId) {
            expect(e.entity.getId()).toBe(entityId);
          }
          resolve();
        }
      });
    });
  }

  @DatabaseEntity("EntityA")
  class MockEntityA extends Entity {}

  @DatabaseEntity("EntityB")
  class MockEntityB extends Entity {}
});
