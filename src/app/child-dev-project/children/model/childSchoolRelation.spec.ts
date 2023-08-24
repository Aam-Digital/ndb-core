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

import { ChildSchoolRelation } from "./childSchoolRelation";
import { testEntitySubclass } from "../../../core/entity/model/entity.spec";

describe("ChildSchoolRelation Entity", () => {
  testEntitySubclass("ChildSchoolRelation", ChildSchoolRelation, {
    _id: "ChildSchoolRelation:some-id",

    childId: "1",
    schoolId: "2",
    schoolClass: "10",
    start: "2019-01-01",
    end: "2019-12-31",
  });
});
