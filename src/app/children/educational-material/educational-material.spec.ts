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

import {async} from '@angular/core/testing';
import {EducationalMaterial} from './educational-material';
import {Entity} from '../../entity/entity';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';

describe('EducationalMaterial Entity', () => {
  const ENTITY_TYPE = 'EducationalMaterial';
  let entitySchemaService: EntitySchemaService;

  beforeEach(async(() => {
    entitySchemaService = new EntitySchemaService();
  }));


  it('has correct _id and entityId and type', function () {
    const id = 'test1';
    const entity = new EducationalMaterial(id);

    expect(entity.getId()).toBe(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it('has correct type/prefix', function () {
    const id = 'test1';
    const entity = new EducationalMaterial(id);

    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it('has all and only defined schema fields in rawData', function () {
    const id = 'test1';
    const expectedData = {
      _id: ENTITY_TYPE + ':' + id,
      _rev: 'XYZ',

      child: '1',
      date: new Date(),
      materialType: 'foo',
      materialAmount: 2,
      description: 'bar',

      searchIndices: [],
    };

    const entity = new EducationalMaterial(id);
    entity._rev = expectedData._rev;
    entity.child = expectedData.child;
    entity.date = expectedData.date;
    entity.materialType = expectedData.materialType;
    entity.materialAmount = expectedData.materialAmount;
    entity.description = expectedData.description;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });
});
