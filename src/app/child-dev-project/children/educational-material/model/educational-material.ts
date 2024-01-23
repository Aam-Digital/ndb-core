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
import { DatabaseEntity } from "../../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../../core/entity/database-field.decorator";
import { ConfigurableEnumValue } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.interface";
import { EntityDatatype } from "../../../../core/basic-datatypes/entity/entity.datatype";
import { Child } from "../../model/child";

@DatabaseEntity("EducationalMaterial")
export class EducationalMaterial extends Entity {
  static create(params: Partial<EducationalMaterial>): EducationalMaterial {
    return Object.assign(new EducationalMaterial(), params);
  }

  @DatabaseField({
    dataType: EntityDatatype.dataType,
    additional: Child.ENTITY_TYPE,
  })
  child: string; // id of Child entity
  @DatabaseField({
    label: $localize`:Date on which the material has been borrowed:Date`,
  })
  date: Date;
  @DatabaseField({
    label: $localize`:The material which has been borrowed:Material`,
    dataType: "configurable-enum",
    additional: "materials",
    validators: {
      required: true,
    },
  })
  materialType: ConfigurableEnumValue;
  @DatabaseField({
    label: $localize`:The amount of the material which has been borrowed:Amount`,
    defaultValue: 1,
    validators: {
      required: true,
    },
  })
  materialAmount: number;
  @DatabaseField({
    label: $localize`:An additional description for the borrowed material:Description`,
  })
  description = "";

  public getColor() {
    return this.materialType?.color || "white";
  }
}
