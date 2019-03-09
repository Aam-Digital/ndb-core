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

describe('Aser', () => {

  it('has correct type/prefix', function () {
    const id = 'test1';
    const entity = new Aser(id);

    expect(entity.getType()).toBe(Aser.ENTITY_TYPE);
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
