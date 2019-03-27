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

import { Entity } from './entity';
import {async} from '@angular/core/testing';
import {EntityModule} from './entity.module';

describe('Entity', () => {
  beforeEach(async(() => {
    EntityModule.registerSchemaDatatypes();
  }));


  it('has ID', function () {
    const id = 'test1';
    const entity = new Entity(id);

    expect(entity.getId()).toBe(id);
  });

  it('has correct type/prefix', function () {
    const id = 'test1';
    const entity = new Entity(id);

    expect(entity.getType()).toBe('Entity');
  });

  it('all schema fields exist', function () {
    const id = 'test1';
    const entity = new Entity(id);

    for (const sField of Entity.schema.keys()) {
      if (!Entity.schema.get(sField).isOptional) {
        expect(entity[sField]).toBeDefined('(' + sField + ' not defined)');
      }
    }
  });

  it('load() assigns all data', function () {
    const id = 'test1';
    const entity = new Entity(id);

    const data = {
      _id: 'test2',
      _rev: '1.2.3',
      other: 'x'
    };
    entity.load(data);

    expect(entity._id).toBe(data._id);
    expect(entity._rev).toBe(data._rev);
    // @ts-ignore   because other is not a defined property of the class (-> TypeScript error) and only added from load(data)
    expect(entity.other).toBe(data.other);
  });

  it('rawData() returns only data matching the schema', function () {
    class TestEntity extends Entity {
      static schema = Entity.schema.extend({
        'text': 'string',
        'defaultText': 'string=default',
      });

      text = 'text';
      defaultText: string;
      otherText = 'other Text';
    }
    const id = 'test1';
    const entity = new TestEntity(id);

    const data = entity.rawData();

    expect(data._id).toBeDefined();
    expect(data.text).toBe('text');
    expect(data.defaultText).toBe('default');
    expect(data.otherText).toBeUndefined();
  });

  it('rawData() includes searchIndices', function () {
    const id = 'test1';
    const entity = new Entity(id);

    const data = entity.rawData();

    expect(data.searchIndices).toBeDefined();
  });
});
