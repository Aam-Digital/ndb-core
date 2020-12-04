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
import { Entity } from "../../../core/entity/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { WarningLevel } from "../../warning-level";
import { EventAttendance } from "./event-attendance";

@DatabaseEntity("EventNote")
export class EventNote extends Entity {
  @DatabaseField() children: EventAttendance[] = [];

  @DatabaseField() date: Date;
  @DatabaseField() author: string = "";
  @DatabaseField() activity: string = "";

  getWarningLevel(): WarningLevel {
    return WarningLevel.NONE;
  }
}
