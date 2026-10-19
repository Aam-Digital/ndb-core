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
});
