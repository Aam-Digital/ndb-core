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

import { Entity } from '../../entity/entity';
import {DatabaseEntity} from '../../entity/database-entity.decorator';
import {DatabaseField} from '../../entity/database-field.decorator';

@DatabaseEntity('EducationalMaterial')
export class EducationalMaterial extends Entity {

  static MATERIAL_STATIONARIES = [
    'pencil',
    'eraser',
    'sharpener',
    'pen (black)',
    'pen (blue)',
    'oil pastels',
    'crayons',
    'sketch pens',
    'scale (big)',
    'scale (small)',
    'geometry box',
    'copy (single line, small)',
    'copy (single line, big)',
    'copy (four line)',
    'copy (squared)',
    'copy (plain)',
    'copy (line-plain)',
    'copy (drawing)',
    'copy (practical)',
    'graph book',
    'project papers',
    'project file',
    'scrap book',
    'exam board',
  ];
  static MATERIAL_OTHER = [
    'Bag',
    'School Uniform',
    'School Shoes',
    'Sports Dress',
    'Sports Shoes',
    'Raincoat',
  ];
  static MATERIAL_ALL = EducationalMaterial.MATERIAL_STATIONARIES.concat(EducationalMaterial.MATERIAL_OTHER);


  @DatabaseField() child: string; // id of Child entity
  @DatabaseField() date: Date;
  @DatabaseField() materialType = '';
  @DatabaseField() materialAmount: number;
  @DatabaseField() description = '';



  public getColor() {
    if (EducationalMaterial.MATERIAL_STATIONARIES.includes(this.materialType)) {
      return 'white';
    } else {
      return '#B3E5FC';
    }
  }
}
