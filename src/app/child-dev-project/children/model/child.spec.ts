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
import { waitForAsync } from "@angular/core/testing";
import { Entity } from "../../../core/entity/model/entity";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { PhotoDatatype } from "../child-photo-service/datatype-photo";
import { genders } from "./genders";

describe("Child", () => {
  const ENTITY_TYPE = "Child";
  let entitySchemaService: EntitySchemaService;

  beforeEach(
    waitForAsync(() => {
      entitySchemaService = new EntitySchemaService();
      entitySchemaService.registerSchemaDatatype(new PhotoDatatype());
    })
  );

  it("has correct _id and entityId and type", function () {
    const id = "test1";
    const entity = new Child(id);

    expect(entity).toHaveId(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it("has correct type/prefix", function () {
    const id = "test1";
    const entity = new Child(id);

    expect(entity).toHaveType(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it("has all and only defined schema fields in rawData", function () {
    const id = "test1";
    const expectedData = {
      _id: ENTITY_TYPE + ":" + id,

      name: "Max",
      projectNumber: "1",
      gender: genders[1],
      dateOfBirth: "2010-01-01",

      photo: "..",
      center: { id: "alpha", label: "Alpha" },
      admissionDate: new Date(),
      status: "Active",

      dropoutDate: new Date(),
      dropoutType: "unknown",
      dropoutRemarks: "no idea what happened",

      searchIndices: [],
    };
    expectedData.searchIndices.push(expectedData.name);
    expectedData.searchIndices.push(expectedData.projectNumber);

    const entity = new Child(id);
    entity.name = expectedData.name;
    entity.projectNumber = expectedData.projectNumber;
    entity.gender = expectedData.gender;
    entity.dateOfBirth = new Date(expectedData.dateOfBirth);

    entity.photo = { path: expectedData.photo, photo: null };
    entity.center = expectedData.center;
    entity.admissionDate = expectedData.admissionDate;
    entity.status = expectedData.status;

    entity.dropoutDate = expectedData.dropoutDate;
    entity.dropoutType = expectedData.dropoutType;
    entity.dropoutRemarks = expectedData.dropoutRemarks;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });
});
