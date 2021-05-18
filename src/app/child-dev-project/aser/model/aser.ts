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
    "Nothing",
    "Read Letters",
    "Read Words",
    "Read Sentence",
    "Read Paragraph",
  ];
  static MathLevels = [
    "Nothing",
    "Numbers 1-9",
    "Numbers 10-99",
    "Subtraction",
    "Division",
  ];

  static isReadingPassedOrNA(level: string) {
    if (level === "" || level === undefined) {
      // not applicable
      return true;
    }
    return level === this.ReadingLevels[4];

  }
  static isMathPassedOrNA(level: string) {
    if (level === "" || level === undefined) {
      // not applicable
      return true;
    }
    return level === this.MathLevels[4];

  }

  @DatabaseField() child: string; // id of Child entity
  @DatabaseField({ label: "Date", ext: Aser.ReadingLevels }) date: Date = new Date();
  @DatabaseField({ label: "Hindi", editComponent: "EditSelectable", ext: Aser.ReadingLevels }) hindi: string = "";
  @DatabaseField({ label: "Bengali", editComponent: "EditSelectable", ext: Aser.ReadingLevels }) bengali: string = "";
  @DatabaseField({ label: "English", editComponent: "EditSelectable", ext: Aser.ReadingLevels }) english: string = "";
  @DatabaseField({ label: "Math", editComponent: "EditSelectable", ext: Aser.MathLevels }) math: string = "";
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
