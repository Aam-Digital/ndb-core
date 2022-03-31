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
import { waitForAsync } from "@angular/core/testing";
import { Entity } from "../entity/model/entity";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";

describe("User", () => {
  const ENTITY_TYPE = "User";
  let entitySchemaService: EntitySchemaService;

  beforeEach(
    waitForAsync(() => {
      entitySchemaService = new EntitySchemaService();
    })
  );

  it("has correct _id and entityId and type", function () {
    const id = "test1";
    const entity = new User(id);

    expect(entity).toHaveId(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it("has correct type/prefix", function () {
    const id = "test1";
    const entity = new User(id);

    expect(entity).toHaveType(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it("has all and only defined schema fields in rawData", function () {
    const id = "test1";
    const expectedData = {
      _id: ENTITY_TYPE + ":" + id,

      name: "tester",
      cloudPasswordEnc: "encryptedPassword",
      cloudBaseFolder: "/aam-digital/",
      paginatorSettingsPageSize: {},

      searchIndices: [],
    };
    expectedData.searchIndices.push(expectedData.name);

    const entity = new User(id);
    entity.name = expectedData.name;
    // @ts-ignore
    entity.cloudPasswordEnc = expectedData.cloudPasswordEnc;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });

  it("sets cloud passwords", () => {
    const user = new User("test1");
    expect(user.cloudPasswordDec).not.toBeDefined();

    user.setCloudPassword("cloudpwd", "userpwd");

    expect(user.cloudPasswordDec).toEqual("cloudpwd");
    expect(user.decryptCloudPassword("userpwd")).toEqual("cloudpwd");
  });
});
