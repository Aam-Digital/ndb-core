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

import { Entity } from "../../../../core/entity/model/entity";
import { DatabaseField } from "../../../../core/entity/database-field.decorator";
import { DatabaseEntity } from "../../../../core/entity/database-entity.decorator";
import {
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "../../../../core/configurable-enum/configurable-enum.interface";
import { MathLevel, mathLevels } from "./mathLevels";
import { ReadingLevel, readingLevels } from "./readingLevels";
import { WarningLevel } from "../../../../core/entity/model/warning-level";

@DatabaseEntity("Aser")
export class Aser extends Entity {
  static isReadingPassedOrNA(level: ConfigurableEnumValue): boolean {
    return this.isHighestLevelOrNA(level, readingLevels);
  }

  static isMathPassedOrNA(level: ConfigurableEnumValue): boolean {
    return this.isHighestLevelOrNA(level, mathLevels);
  }

  static isHighestLevelOrNA(
    level: ConfigurableEnumValue,
    source: ConfigurableEnumConfig
  ): boolean {
    if (!level || level.id === "") {
      // not applicable
      return true;
    }
    const index = source.findIndex((cEnumValue) => cEnumValue.id === level.id);
    return index === source.length - 1;
  }

  @DatabaseField() child: string; // id of Child entity
  @DatabaseField({
    label: $localize`:Label for date of the ASER results:Date`,
  })
  date: Date = new Date();
  @DatabaseField({
    label: $localize`:Label of the Hindi ASER result:Hindi`,
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  hindi: ReadingLevel;
  @DatabaseField({
    label: $localize`:Label of the Bengali ASER result:Bengali`,
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  bengali: ReadingLevel;
  @DatabaseField({
    label: $localize`:Label of the English ASER result:English`,
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  english: ReadingLevel;
  @DatabaseField({
    label: $localize`:Label of the Math ASER result:Math`,
    dataType: "configurable-enum",
    innerDataType: "math-levels",
  })
  math: MathLevel;
  @DatabaseField({
    label: $localize`:Label for the remarks of a ASER result:Remarks`,
  })
  remarks: string = "";

  getWarningLevel(): WarningLevel {
    if (
      Aser.isReadingPassedOrNA(this.english) &&
      Aser.isReadingPassedOrNA(this.hindi) &&
      Aser.isReadingPassedOrNA(this.bengali) &&
      Aser.isMathPassedOrNA(this.math)
    ) {
      return WarningLevel.OK;
    } else {
      return WarningLevel.WARNING;
    }
  }
}
