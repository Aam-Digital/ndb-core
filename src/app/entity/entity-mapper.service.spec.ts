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

import { TestBed, inject } from '@angular/core/testing';

import { EntityMapperService } from './entity-mapper.service';
import { PouchDatabase } from '../database/pouch-database';
import { Entity } from './entity';
import * as PouchDB from 'pouchdb';

describe('EntityMapperService', () => {
  let entityMapper: EntityMapperService;
  let testDatabase: PouchDatabase;
  let pouch: any;

  const existingEntity = {
    _id: 'existing-entity',
    label: 'entity from database'
  };

  beforeEach((done) => {
    pouch = new PouchDB('unit-test');
    pouch.put(existingEntity).then(function () {

      testDatabase = new PouchDatabase(pouch);
      entityMapper = new EntityMapperService(testDatabase);

      done();
    });
  });

  afterEach((done) => {
    pouch.destroy().then(
      function () {
        done();
      });
  });


  it('loads existing entity', function (done) {
    entityMapper.load<Entity>(new Entity(existingEntity._id)).then(
      function (loadedEntity) {
        expect(loadedEntity.getId()).toBe(existingEntity._id);
        done();
      }
    );
  });

  it('rejects promise when loading nonexistent entity', function (done) {
    entityMapper.load<Entity>(new Entity('nonexistent_id')).catch(
      function () {
        done();
      }
    );
  });


  it('saves new entity and loads it', function (done) {
    const entity = new Entity('test1');
    entityMapper.save<Entity>(entity).then(
      function () {
        entityMapper.load<Entity>(new Entity(entity.getId())).then(
          function (loadedEntity) {
            expect(loadedEntity.getId()).toBe(entity.getId());
            done();
          }
        );
      }
    );
  });

  it('rejects promise when saving new entity with existing id', function (done) {
    const duplicateEntity = new Entity(existingEntity._id);
    entityMapper.save<Entity>(duplicateEntity).catch(
      function (error) {
        expect(error).toBeDefined();
        done();
      }
    );
  });

  it('saves new version of existing entity', function (done) {
    entityMapper.load<Entity>(new Entity(existingEntity._id)).then(
      function (loadedEntity) {
        expect(loadedEntity.getId()).toBe(existingEntity._id);

        entityMapper.save<Entity>(loadedEntity);
        done();
      }
    );
  });


  it('removes existing entity', function (done) {
    // entity needs to be an entity loaded from the database in order to remove it
    entityMapper.load<Entity>(new Entity(existingEntity._id)).then(
      function (loadedEntity) {
        entityMapper.remove<Entity>(loadedEntity).then(
          function () {
            entityMapper.load<Entity>(new Entity(existingEntity._id)).catch(
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
  });
});
