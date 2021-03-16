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

import { waitForAsync } from "@angular/core/testing";
import { Entity } from "../../../core/entity/entity";
import { ProgressDashboardConfig } from "./progress-dashboard-config";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";

describe("ProgressDashboardConfig Entity", () => {
  const ENTITY_TYPE = "ProgressDashboardConfig";
  let entitySchemaService: EntitySchemaService;

  beforeEach(
    waitForAsync(() => {
      entitySchemaService = new EntitySchemaService();
    })
  );

  it("has correct _id and entityId and type", function () {
    const id = "test1";
    const entity = new ProgressDashboardConfig(id);

    expect(entity.getId()).toBe(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it("has correct type/prefix", function () {
    const id = "test1";
    const entity = new ProgressDashboardConfig(id);

    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it("has all and only defined schema fields in rawData", function () {
    const id = "test1";
    const expectedData = {
      _id: ENTITY_TYPE + ":" + id,

      title: "test",
      parts: [],

      searchIndices: [],
    };

    const entity = new ProgressDashboardConfig(id);
    entity.title = expectedData.title;
    entity.parts = expectedData.parts;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });
});
