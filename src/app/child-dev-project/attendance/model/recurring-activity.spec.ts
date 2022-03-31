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

import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { waitForAsync } from "@angular/core/testing";
import { RecurringActivity } from "./recurring-activity";
import { Entity } from "../../../core/entity/model/entity";
import { InteractionType } from "../../notes/model/interaction-type.interface";
import { ConfigurableEnumDatatype } from "../../../core/configurable-enum/configurable-enum-datatype/configurable-enum-datatype";

describe("RecurringActivity", () => {
  const ENTITY_TYPE = "RecurringActivity";
  let entitySchemaService: EntitySchemaService;
  const testInteractionTypes: InteractionType[] = [
    {
      id: "HOME_VISIT",
      label: "Home Visit",
    },
    {
      id: "GUARDIAN_TALK",
      label: "Talk with Guardians",
    },
  ];

  beforeEach(
    waitForAsync(() => {
      const mockConfigService = jasmine.createSpyObj("mockConfigService", [
        "getConfig",
      ]);
      mockConfigService.getConfig.and.returnValue(testInteractionTypes);

      entitySchemaService = new EntitySchemaService();
      entitySchemaService.registerSchemaDatatype(
        new ConfigurableEnumDatatype(mockConfigService)
      );
    })
  );

  it("has correct _id and entityId and type", function () {
    const id = "test1";
    const entity = new RecurringActivity(id);

    expect(entity).toHaveId(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it("has correct type/prefix", function () {
    const id = "test1";
    const entity = new RecurringActivity(id);

    expect(entity).toHaveType(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it("has all and only defined schema fields in rawData", function () {
    const id = "test1";
    const expectedData = {
      _id: ENTITY_TYPE + ":" + id,

      title: "test activity",
      type: "HOME_VISIT",
      assignedTo: ["demo"],
      participants: ["1", "2"],
      linkedGroups: ["3"],

      searchIndices: [],
    };

    const entity = new RecurringActivity(id);
    entity.title = expectedData.title;
    entity.type = testInteractionTypes.find((e) => e.id === "HOME_VISIT");
    entity.assignedTo = expectedData.assignedTo;
    entity.participants = expectedData.participants;
    entity.linkedGroups = expectedData.linkedGroups;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });

  it("loads all defined fields from rawData", function () {
    const id = "test1";
    const rawData = {
      _id: ENTITY_TYPE + ":" + id,

      title: "test activity",
      type: "HOME_VISIT",
      assignedTo: ["demo"],
      participants: ["1", "2"],

      searchIndices: [],
    };

    const entity = entitySchemaService.transformDatabaseToEntityFormat(
      rawData,
      RecurringActivity.schema
    );

    expect(entity._id).toBe(rawData._id);
    expect(entity.title).toBe(rawData.title);
    expect(entity.type).toEqual(
      testInteractionTypes.find((e) => e.id === "HOME_VISIT")
    );
    expect(entity.assignedTo).toBe(rawData.assignedTo);
    expect(entity.participants).toBe(rawData.participants);
  });
});
