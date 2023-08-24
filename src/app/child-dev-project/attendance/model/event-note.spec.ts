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

import { EventNote } from "./event-note";
import { testEntitySubclass } from "../../../core/entity/model/entity.spec";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("EventNote", () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
  }));

  testEntitySubclass(
    "EventNote",
    EventNote,
    {
      _id: "EventNote:some-id",
      children: ["child-1", "child-2"],
      childrenAttendance: [
        [
          "child-1",
          {
            status: defaultAttendanceStatusTypes[1].id,
            remarks: "did not show up",
          },
        ],
        [
          "child-2",
          {
            status: defaultAttendanceStatusTypes[0].id,
            remarks: "",
          },
        ],
      ],
      category: defaultInteractionTypes.find((it) => it.isMeeting).id,
      authors: ["some-coach"],
      relatesTo: "RecurringActivity:some-id",
      relatedEntities: ["RecurringActivity:some-id"],
      date: "2023-05-01",
      schools: [],
      subject: "some subject",
      text: "some text about the event",
    },
    true,
  );
});
