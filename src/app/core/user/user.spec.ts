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

import { User } from "./user";
import { testEntitySubclass } from "../entity/model/entity.spec";

describe("User", () => {
  testEntitySubclass("User", User, {
    _id: "User:some-id",

    name: "tester",
    cloudPasswordEnc: "encryptedPassword",
    cloudBaseFolder: "/aam-digital/",
    paginatorSettingsPageSize: {},

    searchIndices: ["tester"],
  });

  it("sets cloud passwords", () => {
    const user = new User("test1");
    expect(user.cloudPasswordDec).not.toBeDefined();

    user.setCloudPassword("cloudpwd", "userpwd");

    expect(user.cloudPasswordDec).toEqual("cloudpwd");
    expect(user.decryptCloudPassword("userpwd")).toEqual("cloudpwd");
  });
});
