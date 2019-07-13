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

import {Entity} from '../../entity/entity';
import {WarningLevel} from './warning-level';
import {AttendanceDay, AttendanceStatus} from './attendance-day';
import {DatabaseEntity} from '../../entity/database-entity.decorator';
import {DatabaseField} from '../../entity/database-field.decorator';

@DatabaseEntity('AttendanceMonth')
export class AttendanceMonth extends Entity {
  static readonly THRESHOLD_URGENT = 0.6;
  static readonly THRESHOLD_WARNING = 0.8;


  public static createAttendanceMonth(childId: string, institution: string) {
    // TODO: logical way to assign entityId to Attendance?
    const newAtt = new AttendanceMonth(childId + '_' + Date.now().toString() + institution);
    newAtt.month = new Date();
    newAtt.student = childId;
    newAtt.institution = institution;
    return newAtt;
  }


  @DatabaseField() student: string; // id of Child entity
  @DatabaseField() remarks: string = '';
  @DatabaseField() institution: string;


  private p_month: Date;
  @DatabaseField({dataType: 'month'})
  get month(): Date {
    return this.p_month;
  }
  set month(value: Date) {
    if (!(value instanceof Date)) {
      console.warn('Trying to set invalid date ' + value + ' to Entity ' + this._id);
      return;
    }

    if (value.getDate() !== 2) {
      value.setDate(2);
    }
    this.p_month = new Date(value);
    this.updateDailyRegister();
  }

  daysWorking_manuallyEntered: number;
  @DatabaseField()
  get daysWorking(): number {
    if (this.daysWorking_manuallyEntered !== undefined) {
      return this.daysWorking_manuallyEntered;
    } else {
      return this.getDaysWorkingFromDailyAttendance();
    }
  }

  set daysWorking(value: number) {
    this.daysWorking_manuallyEntered = value;
  }

  daysAttended_manuallyEntered: number;
  @DatabaseField()
  get daysAttended(): number {
    if (this.daysAttended_manuallyEntered !== undefined) {
      return this.daysAttended_manuallyEntered;
    } else {
      return this.getDaysAttendedFromDailyAttendance();
    }
  }

  set daysAttended(value: number) {
    this.daysAttended_manuallyEntered = value;
  }

  daysExcused_manuallyEntered: number;
  @DatabaseField()
  get daysExcused(): number {
    if (this.daysExcused_manuallyEntered !== undefined) {
      return this.daysExcused_manuallyEntered;
    } else {
      return this.getDaysExcusedFromDailyAttendance();
    }
  }

  set daysExcused(value: number) {
    this.daysExcused_manuallyEntered = value;
  }

  daysLate_manuallyEntered: number;
  @DatabaseField()
  get daysLate(): number {
    if (this.daysLate_manuallyEntered !== undefined) {
      return this.daysLate_manuallyEntered;
    } else {
      return this.calculateFromDailyRegister(AttendanceStatus.LATE);
    }
  }
  set daysLate(value: number) {
    this.daysLate_manuallyEntered = value;
  }

  overridden = false; // indicates individual override during bulk adding

  @DatabaseField()
  dailyRegister = new Array<AttendanceDay>();

  private updateDailyRegister() {
    if (this.month === undefined) {
      return;
    }

    if (this.dailyRegister === undefined) {
      this.dailyRegister = new Array<AttendanceDay>();
    }

    const expectedDays = daysInMonth(this.month);
    const currentDays = this.dailyRegister.length;
    if (currentDays < expectedDays) {
      for (let i = currentDays + 1; i <= expectedDays; i++) {
        const date = new Date(this.month.getFullYear(), this.month.getMonth(), i);
        const day = new AttendanceDay(date);
        this.dailyRegister.push(day);
      }
    } else if (currentDays > expectedDays) {
      this.dailyRegister.splice(expectedDays);
    }

    this.dailyRegister.forEach((day) => {
      day.date.setMonth(this.month.getMonth());
      day.date.setFullYear(this.month.getFullYear());
    });
  }


  private calculateFromDailyRegister(status: AttendanceStatus) {
    let count = 0;
    this.dailyRegister.forEach((day) => {
      if (day.status === status) {
        count++;
      }
    });
    return count;
  }

  public getDaysWorkingFromDailyAttendance() {
    return this.dailyRegister.length
      - this.calculateFromDailyRegister(AttendanceStatus.HOLIDAY)
      - this.calculateFromDailyRegister(AttendanceStatus.UNKNOWN);
  }

  public getDaysAttendedFromDailyAttendance() {
    return this.calculateFromDailyRegister(AttendanceStatus.PRESENT) + this.calculateFromDailyRegister(AttendanceStatus.LATE);
  }

  public getDaysExcusedFromDailyAttendance() {
    return this.calculateFromDailyRegister(AttendanceStatus.EXCUSED);
  }

  public getDaysLateFromDailyAttendance() {
    return this.calculateFromDailyRegister(AttendanceStatus.LATE);
  }


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

export function daysInMonth (date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
