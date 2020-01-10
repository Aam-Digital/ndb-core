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

import { Entity } from '../entity';
import {async} from '@angular/core/testing';
import {EntitySchemaService} from './entity-schema.service';
import {DatabaseField} from '../database-field.decorator';

describe('EntitySchemaService', () => {
  let entitySchemaService: EntitySchemaService;

  beforeEach(async(() => {
    entitySchemaService = new EntitySchemaService();
  }));


  it('schema:string converts to strings', function () {
    class TestEntity extends Entity {
      @DatabaseField() aString: string;
    }
    const id = 'test1';
    const entity = new TestEntity(id);

    const data = {
      _id: 'test2',
      aString: 192
    };
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.aString).toBe('192');

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.aString).toBe('192');
  });

  it('schema:number converts to numbers', function () {
    class TestEntity extends Entity {
      @DatabaseField() aNumber: number;
      @DatabaseField() aFloat: number;
    }
    const id = 'test1';
    const entity = new TestEntity(id);

    const data = {
      _id: 'test2',
      aNumber: '192',
      aFloat: '1.68',
    };
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.aNumber).toBe(192);
    expect(entity.aFloat).toBe(1.68);

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.aNumber).toBe(192);
    expect(rawData.aFloat).toBe(1.68);
  });

  it('schema:date converts to Date object', function () {
    class TestEntity extends Entity {
      @DatabaseField() defaultDate: Date = new Date();
      @DatabaseField() otherDate: Date;
    }
    const id = 'test1';
    const entity = new TestEntity(id);

    const data = {
      _id: 'test2',
      otherDate: '2018-01-01',
    };
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.defaultDate.toDateString()).toBe((new Date()).toDateString());

    expect(entity.otherDate.getFullYear()).toBe(2018);
    expect(entity.otherDate.getMonth()).toBe(0);
    expect(entity.otherDate.getDate()).toBe(1);

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.otherDate).toBe(data.otherDate);
  });

  it('schema:month converts between string and Date objects', function () {
    class TestEntity extends Entity {
      @DatabaseField({dataType: 'month'}) month: Date;
    }
    const id = 'test1';
    const entity = new TestEntity(id);

    const data = {
      _id: 'test2',
      month: '2018-2',
    };
    entitySchemaService.loadDataIntoEntity(entity, data);

    const expectedDate = new Date(2018, 1); // month indices start at 0!
    expect(entity.month.toDateString()).toBe(expectedDate.toDateString());

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.month).toBe('2018-2');
  });
});
