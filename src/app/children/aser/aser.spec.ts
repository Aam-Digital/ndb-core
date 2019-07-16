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

import {Aser} from './aser';
import {WarningLevel} from '../attendance/warning-level';
import {async} from '@angular/core/testing';
import {Entity} from '../../entity/entity';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';

describe('Aser', () => {
  const ENTITY_TYPE = 'Aser';
  const entitySchemaService = new EntitySchemaService();

  beforeEach(async(() => {

  }));


  it('has correct _id and entityId and type', function () {
    const id = 'test1';
    const entity = new Aser(id);

    expect(entity.getId()).toBe(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it('has correct type/prefix', function () {
    const id = 'test1';
    const entity = new Aser(id);

    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it('has all and only defined schema fields in rawData', function () {
    const id = 'test1';
    const expectedData = {
      _id: ENTITY_TYPE + ':' + id,

      child: '1',
      date: new Date(),
      hindi: 'Read Sentence',
      bengali: 'Nothing',
      english: 'Read Letters',
      math: 'Subtraction',
      remarks: 'nothing to remark',

      searchIndices: [],
    };

    const entity = new Aser(id);
    entity.child = expectedData.child;
    entity.date = expectedData.date;
    entity.hindi = expectedData.hindi;
    entity.bengali = expectedData.bengali;
    entity.english = expectedData.english;
    entity.math = expectedData.math;
    entity.remarks = expectedData.remarks;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });



  it('warning level OK if no results', function () {
    const id = 'test1';
    const entity = new Aser(id);

    expect(entity.getWarningLevel()).toBe(WarningLevel.OK);
  });

  it('warning level WARNING if some bad results', function () {
    const id = 'test1';
    const entity = new Aser(id);
    entity.english = Aser.ReadingLevels[0];
    entity.math = Aser.MathLevels[1];

    expect(entity.getWarningLevel()).toBe(WarningLevel.WARNING);
  });

});
