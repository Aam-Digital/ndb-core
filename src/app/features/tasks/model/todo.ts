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
import { User } from "../../../core/user/user";

@DatabaseEntity("Todo")
export class Todo extends Entity {
  static label = $localize`:label for entity:Task`;
  static labelPlural = $localize`:label (plural) for entity:Tasks`;
  static toStringAttributes = ["subject"];

  static create(properties: Object): Todo {
    const instance = new Todo();
    Object.assign(instance, properties);
    return instance;
  }

  @DatabaseField({ label: $localize`:Label:Deadline` })
  deadline: Date;

  @DatabaseField({ label: $localize`:Label:Subject` })
  subject: string = "";

  @DatabaseField({
    label: $localize`:Label:Description`,
    editComponent: "EditLongText",
  })
  description: string = "";

  @DatabaseField({
    label: $localize`:Label:Assigned to`,
    dataType: "entity-array",
    additional: User.ENTITY_TYPE,
  })
  assignedTo: string[] = [];

  /**
   * other records (e.g. a recurring activity, group membership, ...) to which this task is related in some way.
   *
   * This property saves ids including their entity type prefix.
   */
  @DatabaseField({
    label: $localize`:label for the related Entities:Related Records`,
    viewComponent: "DisplayEntityArray",
    editComponent: "EditEntityArray",
    // TODO: transition this to allow linking of multiple/all entity types in the future
    // by default no additional relatedEntities can be linked apart from children and schools, overwrite this in config to display (e.g. additional: "ChildSchoolRelation")
    additional: undefined,
  })
  relatedEntities: string[] = [];
}
