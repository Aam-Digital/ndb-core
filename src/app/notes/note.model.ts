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

import {Entity} from '../entity/entity';
import {WarningLevel} from '../children/attendance/warning-level';
import {DatabaseEntity} from '../entity/database-entity.decorator';
import {DatabaseField} from '../entity/database-field.decorator';
import {AttendanceModel} from './attendance.model';
import {InteractionTypes} from './interaction-types.enum';

@DatabaseEntity('Note')
export class NoteModel extends Entity {

  // The values that 'Type of interaction' can have in the UI / The values that category can have here
  static INTERACTION_TYPES = Object.values(InteractionTypes);
  // An array of triplets containing information about the child and it's attendance
  @DatabaseField({dataType: 'attendancemodel'}) children: AttendanceModel[] = [];
  @DatabaseField() date: Date;
  @DatabaseField() subject: string = '';
  @DatabaseField() text: string = '';
  @DatabaseField() author: string = '';
  @DatabaseField() category: InteractionTypes = InteractionTypes.NONE;
  @DatabaseField({dataType: 'string'}) warningLevel: WarningLevel = WarningLevel.OK;


  getWarningLevel (): WarningLevel {
    return this.warningLevel;
  }

  isLinkedWithChild(childId: string) {
    const found = this.getChildIDs().includes(childId);
    return found;
  }


  public getColor() {
    if (this.warningLevel === WarningLevel.URGENT) {
      return '#fd727280';
    }
    if (this.warningLevel === WarningLevel.WARNING) {
      return '#ffa50080';
    }

    if (this.category === 'Guardians\' Meeting' || this.category === 'Children\'s Meeting') {
      return '#E1F5FE';
    }
    if (this.category === 'Discussion/Decision') {
      return '#E1BEE7';
    }
    if (this.category === 'Annual Survey') {
      return '#FFFDE7';
    }
    if (this.category === 'Daily Routine') {
      return '#F1F8E9';
    }

    return '';
  }

  getChildIDs(): string[] {
    return this.children.map(e => e.childID);
  }

  setChildrenFromIDs(childIDs: string[]) {
    this.children = childIDs.map(childId => new AttendanceModel(childId));
  }

  setDateFromString(date: Object) {
    console.log(date);
  }

  logEvent(event: Event) {
    console.log(event);
    console.log((<HTMLInputElement>event.target).value);
    console.log(event.currentTarget);
  }
}
