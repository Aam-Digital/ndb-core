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

import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { Child } from "app/child-dev-project/children/model/child";
import { Entity } from "app/core/entity/entity";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";

export enum AttendanceStatus {
  UNKNOWN = "?",
  HOLIDAY = "H",
  ABSENT = "A",
  PRESENT = "P",
  LATE = "L",
  EXCUSED = "E",
}

@DatabaseEntity("Attendance")
export class AttendanceDay extends Entity {
  // TODO: adapt fields to new model, eg. remove date
  @DatabaseField({ dataType: "date-only" }) date: Date;
  // TODO: replace string-type by child-type
  @DatabaseField() child: string;
  // TODO: implement reference to event/ change type
  @DatabaseField() event: string;
  @DatabaseField() status: AttendanceStatus = AttendanceStatus.UNKNOWN;
  @DatabaseField() remarks: string = "";

  // constructor(date: Date, status: AttendanceStatus = AttendanceStatus.UNKNOWN) {
  //   this.date = date;
  //   this.status = status;
  // }
}
