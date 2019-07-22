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

import {AttendanceMonth, daysInMonth} from './attendance-month';
import {WarningLevel} from './warning-level';
import {AttendanceDay} from './attendance-day';
import {async} from '@angular/core/testing';
import {Entity} from '../../entity/entity';
import {EntitySchemaService} from '../../entity/schema/entity-schema.service';

describe('AttendanceMonth', () => {
  const ENTITY_TYPE = 'AttendanceMonth';
  let entitySchemaService: EntitySchemaService;

  beforeEach(async(() => {
    entitySchemaService = new EntitySchemaService();
  }));


  it('has correct _id and entityId and type', function () {
    const id = 'test1';
    const entity = new AttendanceMonth(id);

    expect(entity.getId()).toBe(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it('has correct type/prefix', function () {
    const id = 'test1';
    const entity = new AttendanceMonth(id);

    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it('has all and only defined schema fields in rawData', function () {
    const id = 'test1';
    const expectedData = {
      _id: ENTITY_TYPE + ':' + id,

      student: '1',
      institution: 'school',
      month: '2019-1', // TODO: no leading zero in month format?
      remarks: 'more notes',
      daysWorking: 25,
      daysAttended: 20,
      daysExcused: 1,
      daysLate: 1,
      dailyRegister: [],

      searchIndices: [],
    };

    const entity = new AttendanceMonth(id);
    entity.student = expectedData.student;
    entity.institution = expectedData.institution;
    entity.month = new Date(expectedData.month);
    entity.remarks = expectedData.remarks;
    entity.daysWorking = expectedData.daysWorking;
    entity.daysAttended = expectedData.daysAttended;
    entity.daysExcused = expectedData.daysExcused;
    entity.daysLate = expectedData.daysLate;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expectedData.dailyRegister = entity.dailyRegister; // dailyRegister is auto-generated and expected in rawData also
    expect(rawData).toEqual(expectedData);
  });


  it('calculates attendance percentage', () => {
    const working = 10;
    const attended = 1;

    const entity = new AttendanceMonth('');
    entity.month = new Date('2018-01-01');
    entity.daysWorking = working;
    entity.daysAttended = attended;

    expect(entity.getAttendancePercentage()).toBe(attended / working);
  });

  it('gives WarningLevel for low attendance', () => {
    const working = 10;
    const attended = 1;

    const entity = new AttendanceMonth('');
    entity.month = new Date('2018-01-01');
    entity.daysWorking = working;
    entity.daysAttended = attended;

    expect(entity.getWarningLevel()).toBe(WarningLevel.URGENT);
  });


  it('has dailyRegister array after creation', () => {
    const entity = new AttendanceMonth('');

    expect(entity.dailyRegister.length).toBeGreaterThan(-1);
  });

  it('adds/removes dailyRegister entries on month change', () => {
    const month = new Date('2018-01-01');

    const entity = new AttendanceMonth('');
    entity.month = month;

    expect(entity.dailyRegister.length).toBe(daysInMonth(entity.month));
  });

  it('adds/removes dailyRegister entries on load', () => {
    const month = new Date('2018-01-01');

    const entity = new AttendanceMonth('');
    const data = { month: month, daysWorking: 10, daysAttended: 7 };
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.dailyRegister.length).toBe(daysInMonth(entity.month));
  });

  it('updates dailyRegister entries\' date on month change (shorter)', () => {
    const month = new Date('2018-01-01');
    const month2 = new Date('2018-02-01');

    const entity = new AttendanceMonth('');

    entity.month = month;
    expect(entity.dailyRegister.length).toBe(daysInMonth(entity.month));

    entity.month = month2;
    expect(entity.dailyRegister.length).toBe(daysInMonth(entity.month));
    for (let i = 1; i <= daysInMonth(entity.month); i++) {
      expect(entity.dailyRegister[i - 1].date)
        .toEqual(new Date(entity.month.getFullYear(), entity.month.getMonth(), i));
    }
  });

  it('updates dailyRegister entries\' date on month change (longer)', () => {
    const month = new Date('2018-02-01');
    const month2 = new Date('2018-01-01');

    const entity = new AttendanceMonth('');

    entity.month = month;
    expect(entity.dailyRegister.length).toBe(daysInMonth(entity.month));

    entity.month = month2;
    expect(entity.dailyRegister.length).toBe(daysInMonth(entity.month));
    for (let i = 1; i <= daysInMonth(entity.month); i++) {
      expect(entity.dailyRegister[i - 1].date)
        .toEqual(new Date(entity.month.getFullYear(), entity.month.getMonth(), i));
    }
  });


  it('saves & loads manually entered attendance values', () => {
    const originalData = {
      month: new Date('2018-01-01'),
      daysWorking: 10,
      daysAttended: 7,
      daysExcused: 2,
      daysLate: 4,
    };
    const entity = new AttendanceMonth('');

    entitySchemaService.loadDataIntoEntity(entity, originalData);
    expect(entity.daysWorking).toBe(originalData.daysWorking);
    expect(entity.daysAttended).toBe(originalData.daysAttended);
    expect(entity.daysExcused).toBe(originalData.daysExcused);
    expect(entity.daysLate).toBe(originalData.daysLate);

    const data = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(data.daysWorking).toBe(originalData.daysWorking);
    expect(data.daysAttended).toBe(originalData.daysAttended);
    expect(data.daysExcused).toBe(originalData.daysExcused);
    expect(data.daysLate).toBe(originalData.daysLate);
  });


  it('returns month as string in rawData', () => {
    const month = new Date('2018-01-01');
    const entity = new AttendanceMonth('');
    entity.month = month;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(typeof rawData.month).toBe('string');
    expect(rawData.month).toBe('2018-1');
    expect(rawData.p_month).toBeUndefined();
  });

  it('loads month as date from rawData', () => {
    const data = {
      month: '2018-1',
    };
    const entity = new AttendanceMonth('');

    entitySchemaService.loadDataIntoEntity(entity, data);
    expect(entity.month).toEqual(new Date(data.month));
  });


  it('loads AttendanceDay.date values as Date objects', () => {
    const month = new Date('2018-01-01');
    const entity = new AttendanceMonth('');
    entity.month = month;

    expect(entity.dailyRegister.length).toBeGreaterThan(0);
    const data = entitySchemaService.transformEntityToDatabaseFormat(entity);

    const entity2 = new AttendanceMonth('');
    entitySchemaService.loadDataIntoEntity(entity2, data);
    const day1 = entity2.dailyRegister[0];

    expect(day1 instanceof AttendanceDay).toBeTruthy();
    expect(day1.date instanceof Date).toBeTruthy();
  });

});
