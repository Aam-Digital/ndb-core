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
import { AttendanceLogicalStatus } from "#src/app/features/attendance/model/attendance-status";
import { AttendanceDatatype } from "#src/app/features/attendance/model/attendance.datatype";
import { getWarningLevelColor, WarningLevel } from "../../warning-level";
import { Ordering } from "../../../core/basic-datatypes/configurable-enum/configurable-enum-ordering";
import { PLACEHOLDERS } from "../../../core/entity/schema/entity-schema-field";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { asArray } from "../../../utils/asArray";

/**
 * Notes are a special in-built entity type to record free-form information related to other records.
 *
 * Previously, `Note` has also functioned to record an event with an attendance list of participants.
 * That functionality is getting generalized and decoupled from this specific entity.
 * Add a "attendance" type field to any entity type instead.
 *
 * `Note` therefore no longer declares the legacy `children`, `schools` and `childrenAttendance` fields.
 * Systems that still hold data in them have the definitions written into their own `entity:Note` config
 * by the `oneoff-20261008-note-legacy-child-school-fields` CLI migration
 * (see `deprecated/legacy-note-fields.ts`).
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
    relatedEntities: string[] = [],
  ): Note {
    const instance = new Note();
    instance.date = date;
    instance.subject = subject;
    instance.relatedEntities = [...relatedEntities];
    return instance;
  }

  /**
   * All Note properties that link this note to other records,
   * i.e. every "entity" field in the (config-extended) schema except `authors`.
   *
   * This covers the generic `relatedEntities` as well as any custom or legacy entity fields of a system.
   * (`authors` is indexed and queried separately.)
   */
  static getLinkFields(): string[] {
    return [...Note.schema.entries()]
      .filter(
        ([key, field]) => field.dataType === "entity" && key !== "authors",
      )
      .map(([key]) => key)
      .sort();
  }

  /**
   * Returns the name of the Note property where entities of the given entity type are stored:
   * the first "entity" field configured for that type, otherwise `relatedEntities`.
   * @param entityType
   */
  static getPropertyFor(entityType: string): string {
    const matchingField = [...Note.schema.entries()].find(
      ([, field]) =>
        field.dataType === "entity" &&
        asArray(field.additional).includes(entityType),
    );
    return matchingField?.[0] ?? "relatedEntities";
  }

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
    label: $localize`:label for the related Entities:Related Records`,
    dataType: "entity",
    isArray: true,
    // by default no additional relatedEntities can be linked apart from children and schools, overwrite this in config to display (e.g. additional: "ChildSchoolRelation")
    additional: undefined,
    anonymize: "retain",
  })
  relatedEntities: string[] = [];

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
   * Looks at whichever attendance field the (config-extended) schema has,
   * i.e. the modern `attendance` datatype as well as the legacy `event-attendance-map`.
   */
  public getColorForId(participantId: string): string {
    if (this.category?.isMeeting && this.isMarkedAbsent(participantId)) {
      // participant is absent, highlight the entry
      return getWarningLevelColor(WarningLevel.URGENT);
    }
    return this.getColor();
  }

  private isMarkedAbsent(participantId: string): boolean {
    return AttendanceDatatype.detectAllFieldsInEntity(
      this.getConstructor(),
    ).some(({ fieldId }) =>
      (this[fieldId] as AttendanceItem[] | undefined)?.some(
        (item) =>
          item?.participant === participantId &&
          item?.status?.countAs === AttendanceLogicalStatus.ABSENT,
      ),
    );
  }
}
