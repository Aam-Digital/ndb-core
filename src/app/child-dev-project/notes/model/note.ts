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
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "./interaction-type.interface";
import { EventAttendance } from "../../attendance/model/event-attendance";
import {
  AttendanceLogicalStatus,
  NullAttendanceStatusType,
} from "../../attendance/model/attendance-status";
import { User } from "../../../core/user/user";
import { Child } from "../../children/model/child";
import {
  getWarningLevelColor,
  WarningLevel,
} from "../../../core/entity/model/warning-level";
import { School } from "../../schools/model/school";
import { Ordering } from "../../../core/configurable-enum/configurable-enum-ordering";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";

@DatabaseEntity("Note")
export class Note extends Entity {
  static create(
    date: Date,
    subject: string = "",
    children: string[] = []
  ): Note {
    const instance = new Note();
    instance.date = date;
    instance.subject = subject;
    for (const child of children) {
      instance.addChild(child);
    }
    return instance;
  }

  /** IDs of Child entities linked with this note */
  @DatabaseField({
    label: $localize`:Label for the children of a note:Children`,
    viewComponent: "DisplayEntityArray",
    editComponent: "EditEntityArray",
    additional: Child.ENTITY_TYPE,
  })
  children: string[] = [];

  /**
   * optional additional information about attendance at this event for each of the linked children
   *
   * No direct access to change this property. Use the `.getAttendance()` method to have safe access.
   */
  @DatabaseField({ innerDataType: "schema-embed", additional: EventAttendance })
  private childrenAttendance: Map<string, EventAttendance> = new Map();

  @DatabaseField({ label: $localize`:Label for the date of a note:Date` })
  date: Date;
  @DatabaseField({ label: $localize`:Label for the subject of a note:Subject` })
  subject: string = "";
  @DatabaseField({
    label: $localize`:Label for the actual notes of a note:Notes`,
    editComponent: "EditLongText",
  })
  text: string = "";
  /** IDs of users that authored this note */
  @DatabaseField({
    label: $localize`:Label for the social worker(s) who created the note:SW`,
    viewComponent: "DisplayEntityArray",
    editComponent: "EditEntityArray",
    additional: User.ENTITY_TYPE,
  })
  authors: string[] = [];

  @DatabaseField({
    label: $localize`:Label for the category of a note:Category`,
    dataType: "configurable-enum",
    innerDataType: INTERACTION_TYPE_CONFIG_ID,
  })
  category: InteractionType = { id: "", label: "" };

  /**
   * id referencing a different entity (e.g. a recurring activity) this note is related to
   */
  @DatabaseField() relatesTo: string;

  /**
   * other records (e.g. a recurring activity, group membership, ...) to which this note is related in some way,
   * so that notes can be displayed linked to these entities.
   *
   * This property saves ids including their entity type prefix.
   */
  @DatabaseField({
    label: $localize`:label for the related Entities:Related Records`,
    viewComponent: "DisplayEntityArray",
    editComponent: "EditEntityArray",
    // TODO: transition this to allow linking of multiple/all entity types in the future
    additional: ChildSchoolRelation.ENTITY_TYPE,
  })
  relatedEntities: string[] = [];

  /**
   * related school ids (e.g. to infer participants for event roll calls)
   */
  @DatabaseField({
    label: $localize`:label for the linked schools:Groups`,
    additional: School.ENTITY_TYPE,
  })
  schools: string[] = [];

  @DatabaseField({
    label: $localize`:Status of a note:Status`,
    dataType: "configurable-enum",
    innerDataType: "warning-levels",
  })
  warningLevel: Ordering.EnumValue;

  getWarningLevel(): WarningLevel {
    if (this.warningLevel) {
      return WarningLevel[this.warningLevel.id];
    } else {
      return WarningLevel.NONE;
    }
  }

  public getColor() {
    const actualLevel = this.getWarningLevel();
    if (actualLevel === WarningLevel.OK || actualLevel === WarningLevel.NONE) {
      return this.category.color;
    } else {
      return super.getColor();
    }
  }

  public getColorForId(childId: string): string {
    if (
      this.category.isMeeting &&
      this.childrenAttendance.get(childId)?.status.countAs ===
        AttendanceLogicalStatus.ABSENT
    ) {
      // child is absent, highlight the entry
      return getWarningLevelColor(WarningLevel.URGENT);
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
   * @param child The child or the id of the child to add to the notes
   */
  addChild(child: Child | string) {
    const childId = typeof child === "string" ? child : child.getId();
    if (this.children.includes(childId)) {
      return;
    }

    this.children = this.children.concat(childId);
    this.relatedEntities.push(
      Entity.createPrefixedId(Child.ENTITY_TYPE, childId)
    );
  }

  /**
   * adds a new school to this note
   * @param school The school or its id to be added to the note
   */
  addSchool(school: School | string) {
    const schoolId = typeof school === "string" ? school : school.getId();
    if (this.schools.includes(schoolId)) {
      return;
    }

    this.schools = this.schools.concat(schoolId);
    this.relatedEntities.push(
      Entity.createPrefixedId(School.ENTITY_TYPE, schoolId)
    );
  }

  /**
   * Returns the event attendance details for the given child.
   *
   * This method returns a default object that can be used and updated even if no attendance has been recorded yet.
   * Returns undefined if the child is not added to this event/note instance.
   *
   * @param child: The child or the id of the child to look for
   */
  getAttendance(child: string | Child): EventAttendance {
    const childId = typeof child === "string" ? child : child.getId();
    if (!this.children.includes(childId)) {
      return undefined;
    }

    let attendance = this.childrenAttendance.get(childId);
    if (!attendance) {
      attendance = new EventAttendance();
      this.childrenAttendance.set(childId, attendance);
    }
    if (!(attendance instanceof EventAttendance)) {
      attendance = Object.assign(new EventAttendance(), attendance);
    }
    return attendance;
  }

  /**
   * Whether the attendance context information available through `getAttendance` is missing data for some children.
   *
   * While getAttendance will always set and return at least a default value `hasUnknownAttendances` can be used
   * to flag events with incomplete data.
   */
  hasUnknownAttendances(childId?: string): boolean {
    if (childId) {
      return (
        this.getAttendance(childId).status.id === NullAttendanceStatusType.id
      );
    }

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
   * Counts how many children have the given attendance status.
   * The status is counted based on the AttendanceLogicalStatus and the `AttendanceStatusType.countAs` attribute
   * @param status which should be counted
   * @returns number of children with this status
   */
  countWithStatus(status: AttendanceLogicalStatus): number {
    const attendanceValues = this.childrenAttendance.values();
    return [...attendanceValues].filter(
      (attendance) => attendance.status.countAs === status
    ).length;
  }

  /**
   * Performs a deep copy of the note copying all simple data
   * (such as the date, author, e.t.c.) as well as copying the
   * child-array
   */
  copy(): Note {
    const note: Note = super.copy() as Note;
    note.children = [...this.children];
    note.childrenAttendance = new Map();
    this.childrenAttendance.forEach((value, key) => {
      note.childrenAttendance.set(key, value.copy());
    });
    return note;
  }
}
