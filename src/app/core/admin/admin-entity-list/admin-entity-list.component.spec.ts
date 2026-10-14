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

import { TestBed } from "@angular/core/testing";
import { AdminEntityListComponent } from "./admin-entity-list.component";
import { Entity } from "../../entity/model/entity";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";
import { EntityListConfig } from "../../entity-list/EntityListConfig";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { AttendanceDatatype } from "../../../features/attendance/model/attendance.datatype";
import { mockEntityMapperProvider } from "../../entity/entity-mapper/mock-entity-mapper-service";

describe("AdminEntityListComponent", () => {
  // mirrors the real "Event" config entity from the education demo config:
  // a plain config-defined entity with an "attendance" field named "participants",
  // added to config().columns as a plain string (not via the admin field picker)
  @DatabaseEntity("AdminEntityListTestEvent")
  class TestEvent extends Entity {}
  TestEvent.schema.set("date", { dataType: "date", label: "Date" });
  TestEvent.schema.set("category", { dataType: "string", label: "Category" });
  TestEvent.schema.set("participants", {
    dataType: "attendance",
    isArray: true,
    label: "Participants",
    additional: {
      participant: { dataType: "entity", additional: ["Child", "User"] },
    },
  });

  let component: AdminEntityListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminEntityListComponent],
      providers: [
        EntitySchemaService,
        ...mockEntityMapperProvider(),
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: DefaultDatatype, useClass: AttendanceDatatype, multi: true },
      ],
    });

    const fixture = TestBed.createComponent(AdminEntityListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entityConstructor", TestEvent);
    fixture.componentRef.setInput("config", {
      entityType: "AdminEntityListTestEvent",
      columns: ["date", "category", "participants"],
      filters: [{ id: "category" }],
    } as EntityListConfig);
  });

  it("excludes the bare embedded field (participants) from the filter candidates", () => {
    expect(component.filterExcludedFields()).toEqual(["participants"]);
  });

  it("still offers the dot-path properties of the embedded field as filter candidates, once it is a displayed column", () => {
    const ids = component
      .filterAdditionalFields()
      .map((f) => (typeof f === "string" ? f : f.id));

    expect(ids).toEqual(
      expect.arrayContaining([
        "participants", // still present in filterAdditionalFields itself (from config().columns)
        "participants.participant",
        "participants.status",
        "participants.remarks",
      ]),
    );
  });

  it("produces a final filter-candidate list (as AdminListManagerComponent.availableItems would) without the bare field, but with its properties", () => {
    // replicate AdminListManagerComponent.availableItems' exclusion logic here, since that
    // component is only instantiated once the template actually renders
    const excluded = new Set(component.filterExcludedFields());
    const getId = (f) => (typeof f === "string" ? f : f.id);

    const schemaFields = Array.from(TestEvent.schema.keys()).filter(
      (id) => !excluded.has(id),
    );
    const additionalFields = component
      .filterAdditionalFields()
      .filter((f) => !excluded.has(getId(f)));

    const finalIds = [...schemaFields, ...additionalFields].map(getId);

    expect(finalIds).not.toContain("participants");
    expect(finalIds).toEqual(
      expect.arrayContaining([
        "date",
        "category",
        "participants.participant",
        "participants.status",
        "participants.remarks",
      ]),
    );
  });
});
