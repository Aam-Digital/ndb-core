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
  });

  it("should determine isActive based on inferred state", () => {
    const testEntity1 = new Child();
    expect(testEntity1.isActive).withContext("default").toBeTrue();

    testEntity1["exit_date"] = new Date();
    expect(testEntity1.isActive).withContext("exit_date").toBeFalse();

    const testEntity2a = new Child();
    testEntity2a["inactive"] = true;
    expect(testEntity2a.isActive).withContext("inactive").toBeFalse();

    const testEntity2b = new Child();
    testEntity2b["active"] = false;
    expect(testEntity2b.isActive).withContext("active").toBeFalse();

    const testEntity3 = new Child();
    testEntity3["status"] = "Dropout";
    expect(testEntity3.isActive).withContext("Dropout").toBeFalse();

    // always give "inactive" precedence over other logic (as it is trigger in UI)
    const testEntityPrec = new Child();
    testEntityPrec["inactive"] = false;
    testEntityPrec["status"] = "Dropout";
    expect(testEntityPrec.isActive)
      .withContext("inactive taking precedence")
      .toBeTrue();
  });
});
