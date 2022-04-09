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

import { Child } from "./child";
import { genders } from "./genders";
import { testEntitySubclass } from "../../../core/entity/model/entity.spec";
import { centersUnique } from "../demo-data-generators/fixtures/centers";

describe("Child", () => {
  testEntitySubclass("Child", Child, {
    _id: "Child:some-id",

    name: "Max",
    projectNumber: "projectNumber01",
    gender: genders[1].id,
    dateOfBirth: "2010-01-01",

    photo: "..",
    center: centersUnique[0].id,
    admissionDate: new Date("2021-03-1"),
    status: "Active",

    dropoutDate: new Date("2022-03-31"),
    dropoutType: "unknown",
    dropoutRemarks: "no idea what happened",

    searchIndices: ["Max", "projectNumber01"],
  });
});
