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
import { v4 as uuid } from "uuid";
import { Note } from "../../notes/model/note";

@DatabaseEntity("RecurringActivity")
export class RecurringActivity extends Entity {
  static create(title: string = ""): RecurringActivity {
    const instance = new RecurringActivity(uuid());
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
  @DatabaseField() title: string = "";

  /** a category to group and filter activities by */
  @DatabaseField() type: string = "";

  /** IDs of children linked to this activity */
  @DatabaseField() participants: string[] = [];

  /** ID of the user who is responsible for conducting this activity */
  @DatabaseField() assignedTo: string = "";

  toString(): string {
    return this.title;
  }
}
