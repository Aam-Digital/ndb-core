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

@DatabaseEntity("Aser")
export class Aser extends Entity {
  static ReadingLevels = [
    $localize`:Reading levels of a child:Nothing`,
    $localize`:Reading levels of a child:Read Letters`,
    $localize`:Reading levels of a child:Read Words`,
    $localize`:Reading levels of a child:Read Sentence`,
    $localize`:Reading levels of a child:Read Paragraph`,
  ];
  static MathLevels = [
    $localize`:Math levels of a child:Nothing`,
    $localize`:Math levels of a child:Numbers 1-9`,
    $localize`:Math levels of a child:Numbers 10-99`,
    $localize`:Math levels of a child:Subtraction`,
    $localize`:Math levels of a child:Division`,
  ];

  static isReadingPassedOrNA(level: string) {
    if (level === "" || level === undefined) {
      // not applicable
      return true;
    }
    if (level === this.ReadingLevels[4]) {
      // passed highest level
      return true;
    }
    return false;
  }
  static isMathPassedOrNA(level: string) {
    if (level === "" || level === undefined) {
      // not applicable
      return true;
    }
    if (level === this.MathLevels[4]) {
      // passed highest level
      return true;
    }
    return false;
  }

  @DatabaseField() child: string; // id of Child entity
  @DatabaseField() date: Date = new Date();
  @DatabaseField() hindi: string = "";
  @DatabaseField() bengali: string = "";
  @DatabaseField() english: string = "";
  @DatabaseField() math: string = "";
  @DatabaseField() remarks: string = "";

  getWarningLevel(): WarningLevel {
    let warningLevel = WarningLevel.NONE;

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
