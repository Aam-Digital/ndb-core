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
import {WarningLevel} from './warning-level';


export class AttendanceMonth extends Entity {
  static ENTITY_TYPE = 'AttendanceMonth';
  static readonly THRESHOLD_URGENT = 0.6;
  static readonly THRESHOLD_WARNING = 0.8;

  student: string; // id of Child entity
  month: Date;
  daysWorking: number;
  daysAttended: number;
  daysExcused = 0;
  remarks = '';
  institution: string;

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


  public load(data: any) {
    if (data.month !== undefined && typeof data.month !== typeof new Date()) {
      data.month = new Date(data.month);
    }

    return super.load(data);
  }
}
