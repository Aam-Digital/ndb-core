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

import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { attendanceComponents } from "./attendance-components";
import { RecurringActivity } from "./model/recurring-activity";
import { EventNote } from "./model/event-note";
import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import {
  EventAttendanceDatatype,
  EventAttendanceMapDatatype,
} from "./model/event-attendance.datatype";

@NgModule({
  providers: [
    {
      provide: DefaultDatatype,
      useClass: EventAttendanceDatatype,
      multi: true,
    },
    {
      provide: DefaultDatatype,
      useClass: EventAttendanceMapDatatype,
      multi: true,
    },
  ],
})
export class AttendanceModule {
  static databaseEntities = [RecurringActivity, EventNote];

  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(attendanceComponents);
  }
}
