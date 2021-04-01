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

@DatabaseEntity("EducationalMaterial")
export class EducationalMaterial extends Entity {
  static MATERIAL_STATIONARIES = [
    $localize`:education material:pencil`,
    $localize`:education material:eraser`,
    $localize`:education material:sharpener`,
    $localize`:education material:pen (black)`,
    $localize`:education material:pen (blue)`,
    $localize`:education material:oil pastels`,
    $localize`:education material:crayons`,
    $localize`:education material:sketch pens`,
    $localize`:education material:scale (big)`,
    $localize`:education material:scale (small)`,
    $localize`:education material:geometry box`,
    $localize`:education material:copy (single line, small)`,
    $localize`:education material:copy (single line, big)`,
    $localize`:education material:copy (four line)`,
    $localize`:education material:copy (squared)`,
    $localize`:education material:copy (plain)`,
    $localize`:education material:copy (line-plain)`,
    $localize`:education material:copy (drawing)`,
    $localize`:education material:copy (practical)`,
    $localize`:education material:graph book`,
    $localize`:education material:project papers`,
    $localize`:education material:project file`,
    $localize`:education material:scrap book`,
    $localize`:education material:exam board`,
  ];
  static MATERIAL_OTHER = [
    $localize`:education material:Bag`,
    $localize`:education material:School Uniform`,
    $localize`:education material:School Shoes`,
    $localize`:education material:Sports Dress`,
    $localize`:education material:Sports Shoes`,
    $localize`:education material:Raincoat`,
  ];
  static MATERIAL_ALL = EducationalMaterial.MATERIAL_STATIONARIES.concat(
    EducationalMaterial.MATERIAL_OTHER
  );

  @DatabaseField() child: string; // id of Child entity
  @DatabaseField() date: Date;
  @DatabaseField() materialType = "";
  @DatabaseField() materialAmount: number;
  @DatabaseField() description = "";

  public getColor() {
    if (EducationalMaterial.MATERIAL_STATIONARIES.includes(this.materialType)) {
      return "white";
    } else {
      return "#B3E5FC";
    }
  }
}
