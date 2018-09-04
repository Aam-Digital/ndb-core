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

describe('AttendanceMonth', () => {

  it('has ID', function () {
    const id = 'test1';
    const entity = new AttendanceMonth(id);

    expect(entity.getId()).toBe(id);
  });

  it('has correct type/prefix', function () {
    const id = 'test1';
    const entity = new AttendanceMonth(id);

    expect(entity.getType()).toBe('AttendanceMonth');
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
    entity.load(data);

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


  it('returns month as string in rawData', () => {
    const month = new Date('2018-01-01');
    const entity = new AttendanceMonth('');
    entity.month = month;

    expect(typeof entity.rawData().month).toBe('string');
    expect(entity.rawData().p_month).toBeUndefined();
  });

});
