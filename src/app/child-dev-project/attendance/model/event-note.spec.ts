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

import { Entity } from "../../../core/entity/entity";
import { EventNote } from "./event-note";
import { ChildrenService } from "../../children/children.service";
import { School } from "../../schools/model/school";
import { Child } from "../../children/model/child";
import { RecurringActivity } from "./recurring-activity";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";

describe("EventNote", () => {
  const ENTITY_TYPE = "EventNote";

  it("has correct _id and entityId and type", function () {
    const id = "test1";
    const entity = new EventNote(id);

    expect(entity.getId()).toBe(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it("has correct type/prefix", function () {
    const id = "test1";
    const entity = new EventNote(id);

    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it("should add children from a linked school", async () => {
    const mockChildrenService: jasmine.SpyObj<ChildrenService> = jasmine.createSpyObj(
      ["queryRelationsOf"]
    );

    const activity = new RecurringActivity();
    const linkedSchool = new School();
    activity.linkedGroups.push(linkedSchool.getId());

    const childAttendingSchool = new ChildSchoolRelation();
    childAttendingSchool.childId = "child attending school";
    mockChildrenService.queryRelationsOf.and.resolveTo([childAttendingSchool]);

    const directlyAddedChild = new Child();
    activity.participants.push(directlyAddedChild.getId());

    const event = await EventNote.createEventForActivity(
      activity,
      new Date(),
      mockChildrenService
    );

    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "school",
      linkedSchool.getId()
    );
    expect(event.children).toHaveSize(2);
    expect(event.children).toContain(directlyAddedChild.getId());
    expect(event.children).toContain(childAttendingSchool.childId);
  });

  it("should not create duplicate children", async () => {
    const mockChildrenService: jasmine.SpyObj<ChildrenService> = jasmine.createSpyObj(
      ["queryRelationsOf"]
    );

    const activity = new RecurringActivity();
    const linkedSchool = new School();
    activity.linkedGroups.push(linkedSchool.getId());

    const duplicateChild = new Child();
    const duplicateChildRelation = new ChildSchoolRelation();
    duplicateChildRelation.childId = duplicateChild.getId();
    const anotherRelation = new ChildSchoolRelation();
    anotherRelation.childId = "another child id";
    mockChildrenService.queryRelationsOf.and.resolveTo([
      duplicateChildRelation,
      anotherRelation,
    ]);

    const directlyAddedChild = new Child();
    activity.participants.push(
      directlyAddedChild.getId(),
      duplicateChild.getId()
    );

    const event = await EventNote.createEventForActivity(
      activity,
      new Date(),
      mockChildrenService
    );

    expect(event.children).toHaveSize(3);
    expect(event.children).toContain(directlyAddedChild.getId());
    expect(event.children).toContain(duplicateChild.getId());
    expect(event.children).toContain(anotherRelation.childId);
  });
});
