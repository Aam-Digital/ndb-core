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

import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { Note } from "../../notes/model/note";
import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "../../notes/model/interaction-type.interface";
import { User } from "../../../core/user/user";
import { Child } from "../../children/model/child";
import { School } from "../../schools/model/school";

@DatabaseEntity("RecurringActivity")
export class RecurringActivity extends Entity {
  static create(title: string = ""): RecurringActivity {
    const instance = new RecurringActivity();
    instance.title = title;
    return instance;
  }

  /**
   * Check whether the given note instance represents an event of a recurring activity
   * @param note
   */
  static isActivityEventNote(note: Note) {
    return (note?.relatesTo ?? "").startsWith(RecurringActivity.ENTITY_TYPE);
  }

  /** primary name to identify the activity */
  @DatabaseField({
    label: $localize`:Label for the title of a recurring activity:Title`,
    required: true,
  })
  title: string = "";

  /**
   * a category to group and filter activities by.
   *
   * This is also assigned to individual events' category generated for this activity.
   */
  @DatabaseField({
    label: $localize`:Label for the interaction type of a recurring activity:Type`,
    dataType: "configurable-enum",
    innerDataType: INTERACTION_TYPE_CONFIG_ID,
  })
  type: InteractionType;

  /** IDs of children linked to this activity */
  @DatabaseField({
    label: $localize`:Label for the participants of a recurring activity:Participants`,
    viewComponent: "DisplayEntityArray",
    editComponent: "EditEntityArray",
    additional: Child.ENTITY_TYPE,
  })
  participants: string[] = [];

  /** IDs of groups (schools, teams) whose (active) members should be included in the activity*/
  @DatabaseField({
    label: $localize`:Label for the linked schools of a recurring activity:Groups`,
    viewComponent: "DisplayEntityArray",
    editComponent: "EditEntityArray",
    additional: School.ENTITY_TYPE,
  })
  linkedGroups: string[] = [];

  /** IDs of the users who are responsible for conducting this activity */
  @DatabaseField({
    label: $localize`:Label for the assigned user(s) of a recurring activity:Assigned user(s)`,
    viewComponent: "DisplayEntityArray",
    editComponent: "EditEntityArray",
    additional: User.ENTITY_TYPE,
  })
  assignedTo: string[] = [];

  toString(): string {
    return this.title;
  }
}
