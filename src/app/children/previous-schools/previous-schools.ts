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

import { Entity } from '../../entity/entity';
import {WarningLevel} from '../attendance/warning-level';
import {DatabaseEntity} from '../../entity/database-entity.decorator';
import {DatabaseField} from '../../entity/database-field.decorator';

@DatabaseEntity('ChildSchoolRelation')
export class PreviousSchools extends Entity {
  //static ENTITY_TYPE = 'ChildSchoolRelation';

  @DatabaseField() name: string;

  @DatabaseField() childId: string; // id of Child entity
  @DatabaseField({dataType: 'date'}) from: Date;
  @DatabaseField({dataType: 'date'}) to: Date;


  // public load(data: any) {
  //   if (data.date !== undefined && typeof data.date !== typeof new Date()) {
  //     data.date = new Date(data.date);
  //   }

  //   return super.load(data);
  // }


}
