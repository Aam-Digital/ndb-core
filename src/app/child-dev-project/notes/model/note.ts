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
import { AttendanceItem } from "#src/app/features/attendance/model/attendance-item";
import { EventAttendanceMap } from "#src/app/features/attendance/deprecated/event-attendance-map.datatype";
import {
  AttendanceLogicalStatus,
  NullAttendanceStatusType,
} from "#src/app/features/attendance/model/attendance-status";
import { getWarningLevelColor, WarningLevel } from "../../warning-level";
import { Ordering } from "../../../core/basic-datatypes/configurable-enum/configurable-enum-ordering";
import { PLACEHOLDERS } from "../../../core/entity/schema/entity-schema-field";
import { IconName } from "@fortawesome/fontawesome-svg-core";

/**
 * Notes are a special in-built entity type to record free-form information related to other records.
 *
 * Previously, `Note` and `EventNote` have also functioned to record an event with an attendance list of participants.
 * That functionality is getting generalized and decoupled from this specific entity.
 * Add a "attendance" type field to any entity type instead.
 * Attendance-related fields and methods here are currently kept (deprecated) for backwards compatility until all existing data is migrated.
 */
@DatabaseEntity("Note")
export class Note extends Entity {
  static override toStringAttributes = ["subject"];
  static override label = $localize`:label for entity:Note`;
  static override labelPlural = $localize`:label (plural) for entity:Notes`;
  static override icon: IconName = "file-alt";
  static override hasPII = true;

  static create(
    date: Date,
    subject: string = "",
    children: string[] = [],
  ): Note {
    const instance = new Note();
    instance.date = date;
    instance.subject = subject;
    for (const child of children) {
      instance.addChild(child);
    }
    return instance;
  }

  /**
   * Returns the name of the Note property where entities of the given entity type are stored
   * @param entityType
   *
   * @deprecated special logic for Note will be removed. Default structure will only use a combined `relatedEntities` field
   */
  static getPropertyFor(entityType: string) {
    switch (entityType) {
      case "Child":
        return "children";
      case "School":
        return "schools";
      case "User":
        return "authors";
      default:
        return "relatedEntities";
    }
  }

  // TODO: remove these special properties (children, schools) and use relatedEntities instead once the attendance system is generalized (#1364)
  /**
   * IDs of Child entities linked with this note
   *
   * @deprecated Default structure will only use a combined `relatedEntities` field
   */
  @DatabaseField({
    label: $localize`:Label fsor the participants field of a note:Participants`,
    dataType: "entity",
    isArray: true,
    additional: "Child",
    entityReferenceRole: "composite",
    editComponent: "EditLegacyAttendance",
    anonymize: "retain",
  })
  children: string[] = [];

  /**
   * optional additional information about attendance at this event for each of the linked children
   *
   * No direct access to change this property. Use the `.getAttendance()` method to have safe access.
   *
   * @deprecated Attendance logic will be decoupled from Note. By default, notes will not include attendance details anymore. Any entity type can add an `attendance` type field.
   */
  @DatabaseField({ anonymize: "retain" })
  private childrenAttendance: EventAttendanceMap = new EventAttendanceMap();

  @DatabaseField({
    label: $localize`:Label for the date of a note:Date`,
    dataType: "date-only",
    defaultValue: {
      mode: "dynamic",
      config: { value: PLACEHOLDERS.NOW },
    },
    anonymize: "retain",
  })
  date: Date;

  @DatabaseField({
    label: $localize`:Label for the subject of a note:Subject`,
  })
  subject: string;

  @DatabaseField({
    label: $localize`:Label for the actual notes of a note:Notes`,
    dataType: "long-text",
  })
  text: string;

  /** IDs of users that authored this note */
  @DatabaseField({
    label: $localize`:Label for the social worker(s) who created the note:Team involved`,
    dataType: "entity",
    isArray: true,
    additional: "User",
    defaultValue: {
      mode: "dynamic",
      config: { value: PLACEHOLDERS.CURRENT_USER },
    },
    anonymize: "retain",
  })
  authors: string[] = [];

  @DatabaseField({
    label: $localize`:Label for the category of a note:Category`,
    dataType: "configurable-enum",
    additional: INTERACTION_TYPE_CONFIG_ID,
    anonymize: "retain",
  })
  category: InteractionType;

  @DatabaseField({
    label: $localize`Attachment`,
    dataType: "file",
  })
  attachment: string;

  /**
   * id referencing a different entity (e.g. a recurring activity) this note is related to
   */
  @DatabaseField({
    anonymize: "retain",
  })
  relatesTo: string;

  /**
   * other records (e.g. a recurring activity, group membership, ...) to which this note is related in some way,
   * so that notes can be displayed linked to these entities.
   *
   * This property saves ids including their entity type prefix.
   */
  @DatabaseField({
    dataType: "entity",
    isArray: true,
    // by default no additional relatedEntities can be linked apart from children and schools, overwrite this in config to display (e.g. additional: "ChildSchoolRelation")
    additional: undefined,
    anonymize: "retain",
  })
  relatedEntities: string[] = [];

  /**
   * related school ids (e.g. to infer participants for event roll calls)
   *
   * @deprecated Default structure will only use a combined `relatedEntities` field
   */
  @DatabaseField({
    label: $localize`:label for the linked schools:Groups`,
    dataType: "entity",
    isArray: true,
    additional: "School",
    entityReferenceRole: "composite",
    anonymize: "retain",
  })
  schools: string[] = [];

  @DatabaseField({
    label: $localize`:Status of a note:Status`,
    dataType: "configurable-enum",
    additional: "warning-levels",
    anonymize: "retain",
  })
  warningLevel: Ordering.EnumValue;

  override getWarningLevel(): WarningLevel {
    if (this.warningLevel) {
      return WarningLevel[this.warningLevel.id];
    } else {
      return WarningLevel.NONE;
    }
  }

  public override getColor() {
    const actualLevel = this.getWarningLevel();
    if (actualLevel === WarningLevel.OK || actualLevel === WarningLevel.NONE) {
      return this.category?.color;
    } else {
      return super.getColor();
    }
  }

  /**
   * Special color override to reflect the attendance status for a specific participant.
   *
   * @deprecated Attendance logic will be decoupled from Note and only use the new `attendance` datatype
   */
  public getColorForId(childId: string): string {
    if (
      this.category?.isMeeting &&
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
   *
   * @deprecated Attendance logic will be decoupled from Note and only use the new `attendance` datatype
   */
  removeChild(childId: string) {
    this.children = this.children.filter((c) => c !== childId);
    this.childrenAttendance.delete(childId);
  }

  /**
   * adds a new child to this note
   * @param child The child or the id of the child to add to the notes
   *
   * @deprecated Attendance logic will be decoupled from Note and only use the new `attendance` datatype
   */
  addChild(child: Entity | string) {
    const childId = typeof child === "string" ? child : child?.getId();
    if (!childId || this.children.includes(childId)) {
      return;
    }

    this.children = this.children.concat(childId);
  }

  /**
   * adds a new school to this note
   * @param school The school or its id to be added to the note
   *
   * @deprecated Implement duplicate checks at the caller. Special methods will be removed from Note class
   */
  addSchool(school: Entity | string) {
    const schoolId = typeof school === "string" ? school : school.getId();
    if (this.schools.includes(schoolId)) {
      return;
    }

    this.schools = this.schools.concat(schoolId);
  }

  /**
   * Returns the event attendance details for the given child.
   *
   * This method returns a default object that can be used and updated even if no attendance has been recorded yet.
   * Returns undefined if the child is not added to this event/note instance.
   *
   * @param child: The child or the id of the child to look for
   *
   * @deprecated Attendance logic will be decoupled from Note and only use the new `attendance` datatype
   */
  getAttendance(child: string | Entity): AttendanceItem {
    const childId = typeof child === "string" ? child : child.getId();
    if (!this.children.includes(childId)) {
      return undefined;
    }

    let attendance = this.childrenAttendance.get(childId);
    if (!attendance) {
      attendance = new AttendanceItem();
      this.childrenAttendance.set(childId, attendance);
    }
    if (!(attendance instanceof AttendanceItem)) {
      attendance = Object.assign(new AttendanceItem(), attendance);
    }
    return attendance;
  }

  /**
   * Whether the attendance context information available through `getAttendance` is missing data for some children.
   *
   * While getAttendance will always set and return at least a default value `hasUnknownAttendances` can be used
   * to flag events with incomplete data.
   *
   * @deprecated Attendance logic will be decoupled from Note and only use the new `attendance` datatype
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
   *
   * @deprecated Attendance logic will be decoupled from Note and only use the new `attendance` datatype
   */
  countWithStatus(status: AttendanceLogicalStatus): number {
    const attendanceValues = this.childrenAttendance.values();
    return [...attendanceValues].filter(
      (attendance) => attendance.status.countAs === status,
    ).length;
  }

  /**
   * Performs a deep copy of the note copying all simple data
   * (such as the date, author, e.t.c.) as well as copying the
   * child-array
   */
  override copy(): this {
    const note = super.copy();
    note.children = [...this.children];
    note.schools = [...this.schools];
    note.relatedEntities = [...this.relatedEntities];
    note.authors = [...this.authors];
    note.childrenAttendance = new EventAttendanceMap();
    this.childrenAttendance.forEach((value, key) => {
      note.childrenAttendance.set(key, value.copy());
    });
    return note;
  }
}
