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

import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { Entity } from "../../../core/entity/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { WarningLevel, WarningLevelColor } from "../../warning-level";
import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "./interaction-type.interface";
import { EventAttendance } from "../../attendance/model/event-attendance";
import {
  AttendanceLogicalStatus,
  NullAttendanceStatusType,
} from "../../attendance/model/attendance-status";

@DatabaseEntity("Note")
export class Note extends Entity {
  static create(date: Date, subject: string = ""): Note {
    const instance = new Note();
    instance.date = date;
    instance.subject = subject;
    return instance;
  }

  /** IDs of Child entities linked with this note */
  @DatabaseField() children: string[] = [];

  /**
   * optional additional information about attendance at this event for each of the linked children
   *
   * No direct access to change this property. Use the `.getAttendance()` method to have safe access.
   */
  @DatabaseField({ innerDataType: "schema-embed", ext: EventAttendance })
  private childrenAttendance: Map<string, EventAttendance> = new Map();

  @DatabaseField() date: Date;
  @DatabaseField() subject: string = "";
  @DatabaseField() text: string = "";
  /** IDs of authors of this note */
  @DatabaseField() authors: string[] = [];

  @DatabaseField({
    dataType: "configurable-enum",
    innerDataType: INTERACTION_TYPE_CONFIG_ID,
  })
  category: InteractionType = { id: "", label: "" };

  /**
   * id referencing a different entity (e.g. a recurring activity) this note is related to
   */
  @DatabaseField() relatesTo: string;

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
    return color ? color : "";
  }

  public getColorForId(childId: string) {
    if (
      this.category.isMeeting &&
      this.childrenAttendance.get(childId)?.status.countAs ===
        AttendanceLogicalStatus.ABSENT
    ) {
      // child is absent, highlight the entry
      return WarningLevelColor(WarningLevel.URGENT);
    }
    return this.getColor();
  }

  /**
   * removes a specific child from this note
   * @param childId The id of the child to exclude from the notes
   */
  removeChild(childId: string) {
    this.children = this.children.filter((c) => c !== childId);
    this.childrenAttendance.delete(childId);
  }

  /**
   * adds a new child to this note
   * @param childId The id of the child to add to the notes
   */
  addChild(childId: string) {
    if (this.children.includes(childId)) {
      return;
    }

    this.children = this.children.concat(childId);
  }

  /**
   * Returns the event attendance details for the given child.
   *
   * This method returns a default object that can be used and updated even if no attendance has been recorded yet.
   * Returns undefined if the child is not added to this event/note instance.
   *
   * @param childId
   */
  getAttendance(childId: string): EventAttendance {
    if (!this.children.includes(childId)) {
      return undefined;
    }

    let attendance = this.childrenAttendance.get(childId);
    if (!attendance) {
      attendance = new EventAttendance();
      this.childrenAttendance.set(childId, attendance);
    }
    return attendance;
  }

  /**
   * Whether the attendance context information available through `getAttendance` is missing data for some children.
   *
   * While getAttendance will always set and return at least a default value `hasUnknownAttendances` can be used
   * to flag events with incomplete data.
   */
  hasUnknownAttendances(): boolean {
    if (this.childrenAttendance.size < this.children.length) {
      return true;
    } else {
      for (const v of this.childrenAttendance.values()) {
        if (v.status.id === NullAttendanceStatusType.id) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Performs a deep copy of the note copying all simple data
   * (such as the date, author, e.t.c.) as well as copying the
   * child-array
   */
  copy(): Note {
    const note: Note = super.copy() as Note;
    note.children = [...this.children];
    return note;
  }
}
