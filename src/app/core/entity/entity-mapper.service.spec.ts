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
import { Entity } from "./model/entity";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { waitForAsync } from "@angular/core/testing";
import { PouchDatabase } from "../database/pouch-database";
import { entityRegistry } from "../registry/dynamic-registry";

describe("EntityMapperService", () => {
  let entityMapper: EntityMapperService;
  let testDatabase: PouchDatabase;

  const existingEntity = {
    _id: "Entity:existing-entity",
    entityId: "existing-entity",
    label: "entity from database",
  };

  const existingEntity2 = {
    _id: "Entity:existing-entity2",
    entityId: "existing-entity2",
    label: "entity 2 from database",
  };

  beforeEach(
    waitForAsync(() => {
      testDatabase = PouchDatabase.createWithInMemoryDB();
      entityMapper = new EntityMapperService(
        testDatabase,
        new EntitySchemaService(),
        entityRegistry
      );

      return Promise.all([
        testDatabase.put(existingEntity),
        testDatabase.put(existingEntity2),
      ]);
    })
  );

  afterEach(async () => {
    await testDatabase.destroy();
  });

  function expectEntity(actualEntity, expectedEntity) {
    expect(actualEntity.getId()).toBe(expectedEntity.entityId);
    expect(
      Entity.createPrefixedId(actualEntity.getType(), actualEntity.getId())
    ).toBe(expectedEntity._id);

    expect(actualEntity instanceof Entity).toBe(true);
  }

  it("loads existing entity", async () => {
    const loadedEntity = await entityMapper.load<Entity>(
      Entity,
      existingEntity.entityId
    );
    expectEntity(loadedEntity, existingEntity);
  });

  it("load multiple entities", async () => {
    const loadedEntities = await entityMapper.loadType<Entity>(Entity);
    expect(loadedEntities.length).toBe(2);

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
    class TestEntity extends Entity {
      static ENTITY_TYPE = "TestEntity";
    }

    const result = await entityMapper.loadType<TestEntity>(TestEntity);
    expect(result.length).toBe(0);
  });

  it("saves new entity and loads it", async () => {
    const entity = new Entity("test1");

    await entityMapper.save<Entity>(entity);
    const loadedEntity = await entityMapper.load<Entity>(
      Entity,
      entity.getId()
    );
    expectEntity(loadedEntity, entity);
  });

  it("rejects promise when saving new entity with existing entityId", async () => {
    const duplicateEntity = new Entity(existingEntity.entityId);

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
    const loadedEntity = await entityMapper.load<Entity>(
      Entity,
      existingEntity.entityId
    );
    expect(loadedEntity.getId()).toBe(existingEntity.entityId);

    await entityMapper.save<Entity>(loadedEntity);
  });

  it("removes existing entity", async () => {
    const loadedEntity = await entityMapper.load<Entity>(
      Entity,
      existingEntity.entityId
    );
    await entityMapper.remove<Entity>(loadedEntity);

    await expectAsync(
      entityMapper.load<Entity>(Entity, existingEntity.entityId)
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

    const loadedByEntityId = await entityMapper.load<Entity>(
      Entity,
      testEntity.getId()
    );
    expect(loadedByEntityId).toBeDefined();

    expect(loadedByEntityId._id.startsWith(Entity.ENTITY_TYPE)).toBeTruthy();
    const loadedByFullId = await entityMapper.load<Entity>(
      Entity,
      loadedByEntityId._id
    );
    expect(loadedByFullId._id).toBe(loadedByEntityId._id);
    expect(loadedByFullId._rev).toBe(loadedByEntityId._rev);
  });

  it("publishes updates to any listeners", (done) => {
    const testId = "t1";
    receiveUpdatesAndTestTypeAndId(done, undefined, testId);

    const testEntity = new Entity(testId);
    entityMapper
      .save(testEntity, true)
      .then(() => entityMapper.remove(testEntity));
  });

  it("publishes when an existing entity is updated", (done) => {
    receiveUpdatesAndTestTypeAndId(done, "update", existingEntity.entityId);

    entityMapper
      .load<Entity>(Entity, existingEntity.entityId)
      .then((loadedEntity) => entityMapper.save<Entity>(loadedEntity));
  });

  it("publishes when an existing entity is deleted", (done) => {
    receiveUpdatesAndTestTypeAndId(done, "remove", existingEntity.entityId);

    entityMapper
      .load<Entity>(Entity, existingEntity.entityId)
      .then((loadedEntity) => entityMapper.remove<Entity>(loadedEntity));
  });

  it("publishes when a new entity is being saved", (done) => {
    const testId = "t1";
    receiveUpdatesAndTestTypeAndId(done, "new", testId);

    const testEntity = new Entity(testId);
    entityMapper.save(testEntity, true);
  });

  function receiveUpdatesAndTestTypeAndId(
    done: any,
    type?: string,
    entityId?: string
  ) {
    entityMapper.receiveUpdates<Entity>(Entity).subscribe((e) => {
      if (e) {
        if (type) {
          expect(e.type).toBe(type);
        }
        if (entityId) {
          expect(e.entity.entityId).toBe(entityId);
        }
        done();
      }
    });
  }
});
