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
import { WarningLevel } from "../../warning-level";
import { AttendanceDay, AttendanceStatus } from "./attendance-day";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

@DatabaseEntity("AttendanceMonth")
export class AttendanceMonth extends Entity {
  static readonly THRESHOLD_URGENT = 0.6;
  static readonly THRESHOLD_WARNING = 0.8;

  public static createAttendanceMonth(childId: string, institution: string) {
    const month = new Date();
    const newAtt = new AttendanceMonth(
      childId +
        "_" +
        month.getFullYear() +
        "-" +
        (month.getMonth() + 1) +
        "_" +
        institution
    );
    newAtt.month = month;
    newAtt.student = childId;
    newAtt.institution = institution;
    return newAtt;
  }

  @DatabaseField() student: string; // id of Child entity
  @DatabaseField() remarks: string = "";
  @DatabaseField() institution: string;

  private p_month: Date;
  @DatabaseField({ dataType: "month" })
  get month(): Date {
    return this.p_month;
  }
  set month(value: Date) {
    if (!(value instanceof Date)) {
      console.warn(
        "Trying to set invalid date " +
          JSON.stringify(value) +
          " to Entity " +
          this._id
      );
      return;
    }

    if (value.getDate() !== 2) {
      value.setDate(2);
    }
    this.p_month = new Date(value);
  }

  @DatabaseField()
  daysWorking: number;

  @DatabaseField()
  daysAttended: number;

  @DatabaseField()
  daysExcused: number;

  @DatabaseField()
  daysLate: number;

  overridden = false; // indicates individual override during bulk adding

  getAttendancePercentage() {
    return this.daysAttended / (this.daysWorking - this.daysExcused);
  }

  getWarningLevel() {
    const attendance = this.getAttendancePercentage();
    if (attendance < AttendanceMonth.THRESHOLD_URGENT) {
      return WarningLevel.URGENT;
    } else if (attendance < AttendanceMonth.THRESHOLD_WARNING) {
      return WarningLevel.WARNING;
    } else {
      return WarningLevel.OK;
    }
  }
}

export function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
