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

import { Entity } from "../../../core/entity/entity";
import { WarningLevel } from "../../warning-level";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";

export const readingLevels: ConfigurableEnumValue[] = [
  {
    id: "",
    label: "",
  },
  {
    id: "nothing",
    label: "Nothing",
  },
  {
    id: "read_letters",
    label: "Read Letters",
  },
  {
    id: "read_words",
    label: "Read Words",
  },
  {
    id: "read_sentence",
    label: "Read Sentence",
  },
  {
    id: "read_paragraph",
    label: "Read Paragraph",
  },
];

export const mathLevels: ConfigurableEnumValue[] = [
  {
    id: "",
    label: "",
  },
  {
    id: "nothing",
    label: "Nothing",
  },
  {
    id: "numbers1to9",
    label: "Numbers 1-9",
  },
  {
    id: "numbers10to99",
    label: "Numbers 10-99",
  },
  {
    id: "subtraction",
    label: "Subtraction",
  },
  {
    id: "division",
    label: "Division",
  },
];

@DatabaseEntity("Aser")
export class Aser extends Entity {
  static isReadingPassedOrNA(level: ConfigurableEnumValue) {
    if (!level || level.id === "") {
      // not applicable
      return true;
    }
    return level === readingLevels[5];
  }

  static isMathPassedOrNA(level: ConfigurableEnumValue) {
    if (!level || level.id === "") {
      // not applicable
      return true;
    }
    return level === mathLevels[5];
  }

  @DatabaseField() child: string; // id of Child entity
  @DatabaseField({ label: "Date" })
  date: Date = new Date();
  @DatabaseField({
    label: "Hindi",
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  hindi: ConfigurableEnumValue;
  @DatabaseField({
    label: "Bengali",
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  bengali: ConfigurableEnumValue;
  @DatabaseField({
    label: "English",
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  english: ConfigurableEnumValue;
  @DatabaseField({
    label: "Math",
    dataType: "configurable-enum",
    innerDataType: "math-levels",
  })
  math: ConfigurableEnumValue;
  @DatabaseField({ label: "Remarks" }) remarks: string = "";

  getWarningLevel(): WarningLevel {
    let warningLevel;

    if (
      Aser.isReadingPassedOrNA(this.english) &&
      Aser.isReadingPassedOrNA(this.hindi) &&
      Aser.isReadingPassedOrNA(this.bengali) &&
      Aser.isMathPassedOrNA(this.math)
    ) {
      warningLevel = WarningLevel.OK;
    } else {
      warningLevel = WarningLevel.WARNING;
    }

    return warningLevel;
  }
}
