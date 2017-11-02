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

import { PouchDatabase } from './pouch-database';
import * as PouchDB from 'pouchdb';
import { Entity } from '../entity/entity';

describe('PouchDatabase tests', () => {
  /*
    class TestEntityHasMany extends Entity {

      private _manyEntities: TestEntityBelongsTo[];

      get manyEntities(): TestEntityBelongsTo[] {
        return this._manyEntities;
      }

      set manyEntities(value: TestEntityBelongsTo[]) {
        this._manyEntities = value;
      }
    }

    class TestEntityBelongsTo extends Entity {

      private _belongsToEntity: TestEntityHasMany;

      get belongsToEntity(): TestEntityHasMany {
        return this._belongsToEntity;
      }

      set belongsToEntity(value: TestEntityHasMany) {
        this._belongsToEntity = value;
      }
    }*/

  let pouchDatabase: PouchDatabase;
  let pouch: any;

  beforeEach(() => {
    pouch = new PouchDB('unit-test');
    pouch.setSchema([
      {
        singular: 'Entity',
        plural: 'Entities'
      },
      {
        singular: 'TestEntityHasMany',
        plural: 'TestEntitiesHasMany',
        relations: {_manyEntities: {hasMany: 'TestEntityBelongsTo'}}
      },
      {
        singular: 'TestEntityBelongsTo',
        plural: 'TestEntitiesBelongsTo',
        relations: {_belongsToEntity: {belongsTo: 'TestEntityHasMany'}}
      }
    ]);
    pouchDatabase = new PouchDatabase(pouch);
  });

  afterEach((done) => {
    pouch.destroy().then(
      function () {
        done();
      });
  });

  it('add object to database', function (done) {
    pouchDatabase.put(new Entity("testentity")).then(
      done(),
    ).catch(err => console.log(err));
  });

  /*
  it('get object by _id after put into database', function (done) {
    const id = 'test_id';
    const name = 'test';
    const count = 42;
    const testData = {_id: id, name: name, count: count};

    pouchDatabase.put(testData).then(
      function () {
        getObjectAndCompare();
      },
      function () {
        expect(false).toBe(true, 'promise of pouchDatabase.put failed');
      }
    );

    function getObjectAndCompare() {
      pouchDatabase.get(id).then(
        function (resultData: any) {
          expect(resultData._id).toEqual(id);
          expect(resultData.name).toEqual(name);
          expect(resultData.count).toEqual(count);
          done();
        },
        function () {
          expect(false).toBe(true, 'promise of pouchDatabase.get failed');
        }
      );
    }
  });

  it('fails to get by not existing entityId', function (done) {
    pouchDatabase.get('some_id').then(
      function () {
        expect(true).toBe(false, 'retrieved object despite get on non-existing _id');
      },
      function (err: any) {
        expect(err).toBeDefined();
        done();
      }
    );
  });*/
});
