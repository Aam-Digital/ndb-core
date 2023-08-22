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
import { SkillLevel } from "./skill-levels";
import { WarningLevel } from "../../../warning-level";
import { ConfigurableEnumDatatype } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { PLACEHOLDERS } from "../../../../core/entity/schema/entity-schema-field";

@DatabaseEntity("Aser")
export class Aser extends Entity {
  @DatabaseField() child: string; // id of Child entity
  @DatabaseField({
    label: $localize`:Label for date of the ASER results:Date`,
    defaultValue: PLACEHOLDERS.NOW,
  })
  date: Date;
  @DatabaseField({
    label: $localize`:Label of the Hindi ASER result:Hindi`,
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  hindi: SkillLevel;
  @DatabaseField({
    label: $localize`:Label of the Bengali ASER result:Bengali`,
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  bengali: SkillLevel;
  @DatabaseField({
    label: $localize`:Label of the English ASER result:English`,
    dataType: "configurable-enum",
    innerDataType: "reading-levels",
  })
  english: SkillLevel;
  @DatabaseField({
    label: $localize`:Label of the Math ASER result:Math`,
    dataType: "configurable-enum",
    innerDataType: "math-levels",
  })
  math: SkillLevel;
  @DatabaseField({
    label: $localize`:Label for the remarks of a ASER result:Remarks`,
  })
  remarks: string = "";

  getWarningLevel(): WarningLevel {
    if (this.hasPassedEverything()) {
      return WarningLevel.OK;
    } else {
      return WarningLevel.WARNING;
    }
  }

  private hasPassedEverything(): boolean {
    const schema = this.getSchema();
    return Object.keys(this)
      .filter(
        (key) =>
          schema.get(key)?.dataType === ConfigurableEnumDatatype.dataType,
      )
      .every((key) => this.isPassed(this[key]));
  }

  private isPassed(value: SkillLevel): boolean {
    return !value || value.id === "" || value.passed;
  }
}
