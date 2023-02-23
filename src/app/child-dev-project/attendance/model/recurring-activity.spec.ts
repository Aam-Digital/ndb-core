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

import { RecurringActivity } from "./recurring-activity";
import { testEntitySubclass } from "../../../core/entity/model/entity.spec";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";

describe("RecurringActivity", () => {
  testEntitySubclass("RecurringActivity", RecurringActivity, {
    _id: "RecurringActivity:some-id",

    title: "test activity",
    type: defaultInteractionTypes[1].id,
    assignedTo: ["demo"],
    participants: ["1", "2"],
    linkedGroups: ["3"],
    excludedParticipants: ["5"],
  });
});
