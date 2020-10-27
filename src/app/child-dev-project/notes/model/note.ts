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

import { MeetingNoteAttendance } from "../meeting-note-attendance";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { WarningLevel, WarningLevelColor } from "../../warning-level";
import { InteractionType } from "../note-details/note-config.interface";

@DatabaseEntity("Note")
export class Note extends Entity {
  /** IDs of Child entities linked with this note */
  @DatabaseField() children: string[] = [];
  /** An array of triplets containing information about the child and it's attendance */
  @DatabaseField() attendances: MeetingNoteAttendance[] = [];
  @DatabaseField() date: Date;
  @DatabaseField() subject: string = "";
  @DatabaseField() text: string = "";
  @DatabaseField() author: string = "";
  @DatabaseField({ dataType: "interaction-type" }) category: InteractionType = {
    name: "NONE",
  };
  @DatabaseField({ dataType: "string" }) warningLevel: WarningLevel =
    WarningLevel.OK;

  getWarningLevel(): WarningLevel {
    return this.warningLevel;
  }

  // TODO: color logic should not be part of entity/model but rather in the component responsible for displaying it
  public getColor() {
    if (this.warningLevel === WarningLevel.URGENT) {
      return WarningLevelColor(WarningLevel.URGENT);
    }
    if (this.warningLevel === WarningLevel.WARNING) {
      return WarningLevelColor(WarningLevel.WARNING);
    }

    const color = this.category.color;
    return color ? "" : color;
  }

  public getColorForId(entityId: string) {
    if (this.category.isMeeting && !this.isPresent(entityId)) {
      // child is absent, highlight the entry
      return WarningLevelColor(WarningLevel.URGENT);
    }
    return this.getColor();
  }

  /**
   * whether a specific child with given childId is linked to this not
   * @param childId The childId to check for
   */
  isLinkedWithChild(childId: string): boolean {
    return this.children.includes(childId);
  }

  /**
   * returns the children that were either present or absent
   * @param presence true to get the children that were present, false to get the children that were absent
   */
  childrenWithPresence(presence: boolean): MeetingNoteAttendance[] {
    return this.attendances.filter(
      (attendance) => attendance.present === presence
    );
  }

  /**
   * whether or not a specific child was present or not.
   * This does not check whether or not this note is a meeting and will not return
   * a sensible value, if this child couldn't be found
   * @param childId The id of the child to check for
   */
  isPresent(childId: string): boolean {
    const child = this.attendances.find(
      (attendance) => attendance.childId === childId
    );
    if (child !== undefined) {
      return child.present;
    }
  }

  /**
   * removes a specific child from this note
   * @param childId The id of the child to exclude from the notes
   */
  removeChild(childId: string) {
    this.children.splice(this.children.indexOf(childId), 1);
    this.attendances.splice(
      this.attendances.findIndex(
        (attendance) => attendance.childId === childId
      ),
      1
    );
  }

  /**
   * adds a new child to this note
   * @param childId The id of the child to add to the notes
   */
  addChild(childId: string) {
    this.children.splice(0, 0, childId);
    this.attendances.splice(0, 0, new MeetingNoteAttendance(childId));
  }

  /**
   * adds multiple children to this note
   * @param childIds The id's of the children to add
   */
  addChildren(...childIds: string[]) {
    childIds.forEach((child) => this.addChild(child));
  }

  /**
   * Toggles for a given child it's presence.
   * If the child was absent, the presence-field will be true for that child.
   * If the child was present, the presence-field will be false for that child
   * @param childId The ID of the child
   */
  togglePresence(childId: string) {
    const child = this.attendances.find(
      (attendance) => attendance.childId === childId
    );
    if (child !== undefined) {
      child.present = !child.present;
    }
  }
}
