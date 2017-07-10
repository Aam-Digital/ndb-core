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
import { PouchDatabase } from '../database/pouch-database';
import { Entity } from './entity';
import * as PouchDB from 'pouchdb';

describe('EntityMapperService', () => {
  let entityMapper: EntityMapperService;
  let testDatabase: PouchDatabase;
  let pouch: any;

  const existingEntity = {
    _id: 'Entity:existing-entity',
    entityId: 'existing-entity',
    prefix: 'Entity',
    label: 'entity from database'
  };

  const existingEntity2 = {
    _id: 'Entity:existing-entity2',
    entityId: 'existing-entity2',
    prefix: 'Entity',
    label: 'entity 2 from database'
  };

  beforeEach((done) => {
    pouch = new PouchDB('unit-test');
    pouch.put(existingEntity).then(function () {
      pouch.put(existingEntity2).then(function () {
        testDatabase = new PouchDatabase(pouch);
        entityMapper = new EntityMapperService(testDatabase);

        done();
      }).catch(err => console.log('Failed to insert second entity: ' + err));
    }).catch(err => console.log('Failed to insert default entity: ' + err));
  });

  afterEach((done) => {
    pouch.destroy().then(
      function () {
        done();
      });
  });

  it('loads existing entity', function (done) {
    entityMapper.load<Entity>(Entity, existingEntity.entityId).then(
      function (loadedEntity) {
        expect(loadedEntity.getId()).toBe(existingEntity.entityId);
        expect(loadedEntity.getPrefix()).toBe(existingEntity.prefix);
        expect(Entity.getDatabaseId(loadedEntity.getPrefix(), loadedEntity.getId()))
          .toBe(existingEntity._id);
        done();
      }
    ).catch(function (err) {
      console.log('Failed to load entity');
      console.log(err);
      fail();
    });
  });
  /*
   it('load multiple entities', function (done) {
   entityMapper.loadAll<Entity>(Entity).then(
   function (loadedEntities) {
   expect(loadedEntities.length).toBe(2);

   const entity1 = loadedEntities[0];
   const entity2 = loadedEntities[1];

   expect(entity1.getId()).toBe(existingEntity.entityId);
   expect(entity1.getPrefix()).toBe(existingEntity.prefix);
   expect(entity1.getIdWithPrefix()).toBe(existingEntity._id);
   expect(entity1 instanceof Entity).toBe(true);

   expect(entity2.getId()).toBe(existingEntity2.entityId);
   expect(entity2.getPrefix()).toBe(existingEntity2.prefix);
   expect(entity2.getIdWithPrefix()).toBe(existingEntity2._id);
   expect(entity2 instanceof Entity).toBe(true);
   done();
   }
   )
   });

   it('rejects promise when loading nonexistent entity', function (done) {
   entityMapper.load<Entity>(new Entity('nonexistent_id')).catch(
   function () {
   done();
   }
   );
   });

   it('returns empty array when loading non existing entity type ', function (done) {
   class TestEntity extends Entity {
   }
   entityMapper.loadAll<TestEntity>(TestEntity).then((result) => {
   expect(result.length).toBe(0);
   done()
   });
   });

   it('saves new entity and loads it', function (done) {
   const entity = new Entity('test1');
   entityMapper.save<Entity>(entity).then(
   function () {
   entityMapper.load<Entity>(new Entity(entity.getId())).then(
   function (loadedEntity) {
   expect(loadedEntity.getId()).toBe(entity.getId());
   expect(loadedEntity.getPrefix()).toBe(entity.getPrefix());
   expect(loadedEntity.getIdWithPrefix()).toBe(entity.getIdWithPrefix());
   done();
   }
   );
   }
   );
   });

   it('rejects promise when saving new entity with existing entityId', function (done) {
   const duplicateEntity = new Entity(existingEntity.entityId);
   entityMapper.save<Entity>(duplicateEntity).catch(
   function (error) {
   expect(error).toBeDefined();
   done();
   }
   );
   });

   it('saves new version of existing entity', function (done) {
   entityMapper.load<Entity>(new Entity(existingEntity.entityId)).then(
   function (loadedEntity) {
   expect(loadedEntity.getId()).toBe(existingEntity.entityId);

   entityMapper
   .save<Entity>(loadedEntity)
   .then(() => done())
   .catch((err) => {
   console.log(err);
   fail()
   });
   }
   );
   });


   it('removes existing entity', function (done) {
   // entity needs to be an entity loaded from the database in order to remove it
   entityMapper.load<Entity>(new Entity(existingEntity.entityId)).then(
   function (loadedEntity) {
   entityMapper.remove<Entity>(loadedEntity).then(
   function () {
   entityMapper.load<Entity>(new Entity(existingEntity.entityId)).catch(
   function () {
   done();
   }
   );
   }
   );
   }
   );
   });

   it('rejects promise removing nonexistent entity', function (done) {
   const nonexistingEntity = new Entity('nonexistent-entity');
   entityMapper.remove<Entity>(nonexistingEntity).catch(
   function (error) {
   expect(error).toBeDefined();
   done();
   }
   );
   });*/
});
