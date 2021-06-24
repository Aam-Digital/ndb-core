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
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";

@DatabaseEntity("EducationalMaterial")
export class EducationalMaterial extends Entity {

  @DatabaseField() child: string; // id of Child entity
  @DatabaseField({ label: "Date" }) date: Date;
  @DatabaseField({
    label: "Material",
    dataType: "configurable-enum",
    innerDataType: "materials",
  })
  materialType: ConfigurableEnumValue;
  @DatabaseField({ label: "Amount" }) materialAmount: number;
  @DatabaseField({ label: "Description" }) description = "";

  public getColor() {
    return this.materialType && this.materialType["color"]
      ? this.materialType["color"]
      : "white";
  }
}
