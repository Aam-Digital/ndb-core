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

import { EntityMapperService } from './entity-mapper.service';
import { Entity } from './entity';
import {MockDatabase} from '../database/mock-database';
import {Database} from '../database/database';

describe('EntityMapperService', () => {
  let entityMapper: EntityMapperService;
  let testDatabase: Database;

  const existingEntity = {
    _id: 'Entity:existing-entity',
    entityId: 'existing-entity',
    label: 'entity from database'
  };

  const existingEntity2 = {
    _id: 'Entity:existing-entity2',
    entityId: 'existing-entity2',
    label: 'entity 2 from database'
  };

  beforeEach((done) => {
    testDatabase = new MockDatabase();
    entityMapper = new EntityMapperService(testDatabase);

    Promise.all([testDatabase.put(existingEntity), testDatabase.put(existingEntity2)])
      .then(function () { done(); })
      .catch(err => console.log('Failed to insert entity: ' + err));
  });


  function expectEntity(actualEntity, expectedEntity) {
    expect(actualEntity.getId()).toBe(expectedEntity.entityId);
    expect(Entity.createPrefixedId(actualEntity.getType(), actualEntity.getId()))
      .toBe(expectedEntity._id);

    expect(actualEntity instanceof Entity).toBe(true);
  }



  it('loads existing entity', function (done) {
    entityMapper.load<Entity>(Entity, existingEntity.entityId)
      .then((loadedEntity) => {
        expectEntity(loadedEntity, existingEntity);
        done();
      })
      .catch(function (err) {
        console.log('Failed to load entity: ' + err);
        fail(err);
      });
  });

  it('load multiple entities', function (done) {
    entityMapper.loadType<Entity>(Entity).then(
      function (loadedEntities) {
        expect(loadedEntities.length).toBe(2);

        const entity1 = loadedEntities[0];
        const entity2 = loadedEntities[1];

        expectEntity(entity1, existingEntity);
        expectEntity(entity2, existingEntity2);
        done();
      }
    )
  });

  it('rejects promise when loading nonexistent entity', function (done) {
    entityMapper.load<Entity>(Entity, 'nonexistent_id').catch(
      (err) => {
        expect(err).toBeDefined('"not found" error not defined');
        done();
      }
    );
  });

  it('returns empty array when loading non existing entity type ', function (done) {
    class TestEntity extends Entity {
      static ENTITY_TYPE = 'TestEntity';
    }

    entityMapper.loadType<TestEntity>(TestEntity).then((result) => {
      expect(result.length).toBe(0);
      done()
    });
  });

  it('saves new entity and loads it', function (done) {
    const entity = new Entity('test1');

    (async function() {
      try {
        await entityMapper.save<Entity>(entity);
        const loadedEntity = await entityMapper.load<Entity>(Entity, entity.getId());
        expectEntity(loadedEntity, entity);
        done();
      } catch (err) {
        fail(err);
        done();
      }
    })();
  });

  it('rejects promise when saving new entity with existing entityId', function (done) {
    const duplicateEntity = new Entity(existingEntity.entityId);

    entityMapper.save<Entity>(duplicateEntity)
      .then(() => {
        fail('unexpectedly succeeded to overwrite existing entity');
        done();
      })
      .catch(
      function (error) {
        expect(error).toBeDefined();
        done();
      });
  });

  it('saves new version of existing entity', function (done) {
    (async function() {
      try {
        const loadedEntity = await entityMapper.load<Entity>(Entity, existingEntity.entityId);
        expect(loadedEntity.getId()).toBe(existingEntity.entityId);

        await entityMapper.save<Entity>(loadedEntity);
        done();
      } catch (err) {
        fail(err);
        done();
      }
    })();
  });

  it('removes existing entity', function (done) {
    (async function() {
      try {
        const loadedEntity = await entityMapper.load<Entity>(Entity, existingEntity.entityId);
        await entityMapper.remove<Entity>(loadedEntity);
        entityMapper.load<Entity>(Entity, existingEntity.entityId)
          .catch((err) => {
            expect(err).toBeDefined('"not found" error not defined');
            done();
          });
      } catch (err) {
        fail(err);
        done();
      }
    })();
  });

  it('rejects promise removing nonexistent entity', function (done) {
    const nonexistingEntity = new Entity('nonexistent-entity');

    entityMapper.remove<Entity>(nonexistingEntity)
      .catch((error) => {
        expect(error).toBeDefined();
        done();
      });
  });


  it('loads entity for id given with and without prefix', async () => {
    const testId = 't1';
    const testEntity = new Entity(testId);
    await entityMapper.save(testEntity);

    const loadedByEntityId = await entityMapper.load<Entity>(Entity, testEntity.getId());
    expect(loadedByEntityId).toBeDefined();

    expect(loadedByEntityId._id.startsWith(Entity.ENTITY_TYPE)).toBeTruthy();
    const loadedByFullId = await entityMapper.load<Entity>(Entity, loadedByEntityId._id);
    expect(loadedByFullId._id).toBe(loadedByEntityId._id);
    expect(loadedByFullId._rev).toBe(loadedByEntityId._rev);
  });
});
