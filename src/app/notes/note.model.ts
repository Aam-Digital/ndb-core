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

  /**
   * returns whether a specific child with given childID is linked to this not
   * @param childId The childID to check for
   */

  isLinkedWithChild(childId: string) {
    return this.getChildIDs().includes(childId);
  }

  /**
   * returns whether or not this note's contents describe a meeting
   */

  isMeeting(): boolean {
    return  this.category === InteractionTypes.GUARDIAN_MEETING ||
            this.category === InteractionTypes.CHILDREN_MEETING ||
            this.category === InteractionTypes.EXCURSION;
  }

  /**
   * returns the children that were either present or absent
   * @param presence true to get the children that were present, false to get the children that were absent
   */

  childrenWithPresence(presence: boolean): AttendanceModel[] {
    return this.children.filter(attendance => {
      return attendance.present === presence;
    });
  }

  public getColor() {
    if (this.warningLevel === WarningLevel.URGENT) {
      return '#fd727280';
    }
    if (this.warningLevel === WarningLevel.WARNING) {
      return '#ffa50080';
    }

    if (this.isMeeting()) {
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

  /**
   * return a specific color for a certain child, represented by it's id.
   * This color is different than the <code>getColor()</code>-Method, if
   * the entityId corresponds to a certain child in this note and this note's category is a meeting
   * @param entityId The id of the child to get the color for
   */

  public getColorForId(entityId: string) {
    // if the child is not part of this note or this is not a meeting-note, return the default color
    if (!this.isLinkedWithChild(entityId) || !this.isMeeting()) {
      return this.getColor();
    }
    // if the child is present, return a green color
    if (this.isPresent(entityId)) {
      return 'rgba(71,253,24,0.5)';
    }
    // else, return a red color
    return 'rgba(219,49,36,0.51)';
  }

  /**
   * returns the children linked to this note as string-id's
   */
  getChildIDs(): string[] {
    return this.children.map(e => e.childID);
  }

  /**
   * returns whether or not a specific child was present or not.
   * This does not check whether or not, this note is a meeting and will not return
   * a sensible value, if this child couldn't be found
   * @param childId The id of the child to check for
   */

  isPresent(childId: string): boolean {
    const child = this.children.find(attendance => attendance.childID === childId);
    if (child !== undefined) {return child.present; }
  }

  /**
   * removes a specific child from this note
   * @param childId The id of the child to exclude from the notes
   */

  removeChild(childId: string) {
    this.children = this.children.filter(attendance => attendance.childID !== childId);
  }

  /**
   * adds a new child to this note
   * @param childId The id of the child to add to the notes
   */

  addChild(childId: string) {
    this.children.push(new AttendanceModel(childId));
  }

  /**
   * Toggles for a given child it's presence.
   * If the child was absent, the presence-field will be true for that child.
   * If the child was present, the presence-field will be false for that child
   * @param childId The ID of the child
   */

  togglePresence(childId: string) {
    this.children.forEach(attendance => {
      if (attendance.childID === childId) {
        attendance.present = !attendance.present;
      }
    });
  }
}
