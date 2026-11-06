import { ComponentFixture, TestBed } from "@angular/core/testing";
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
import { Component, input } from "@angular/core";
import { By } from "@angular/platform-browser";
import { ComponentRegistry } from "#src/app/dynamic-components";
import { ADMIN_ENTITY_LIST_SETTINGS } from "./admin-entity-list-settings";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

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
  let fixture: ComponentFixture<AdminEntityListComponent>;

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

    fixture = TestBed.createComponent(AdminEntityListComponent);
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

  it("keeps offering a configured nested filter after its embedded field is removed from the columns", () => {
    fixture.componentRef.setInput("config", {
      entityType: "AdminEntityListTestEvent",
      columns: ["date", "category"],
      filters: [{ id: "participants.participant" }],
    } as EntityListConfig);

    const ids = component
      .filterAdditionalFields()
      .map((f) => (typeof f === "string" ? f : f.id));

    expect(ids).toContain("participants.participant");
    expect(ids).not.toContain("participants.status");
  });
});

describe("AdminEntityListComponent settings of feature modules", () => {
  it("shows the list settings of feature modules for the edited list", async () => {
    TestBed.configureTestingModule({
      imports: [AdminEntityListComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ADMIN_ENTITY_LIST_SETTINGS,
          useValue: "TestListSettings",
          multi: true,
        },
      ],
    });
    const registry = TestBed.inject(ComponentRegistry);
    registry.add("TestListSettings", async () => TestListSettingsComponent);
    // the registry is shared by all specs of a test worker
    onTestFinished(() => {
      registry.delete("TestListSettings");
    });
    const fixture = TestBed.createComponent(AdminEntityListComponent);
    fixture.componentRef.setInput("entityConstructor", TestEntity);
    fixture.componentRef.setInput("config", {
      entityType: "TestEntity",
    } as EntityListConfig);

    fixture.detectChanges();
    await fixture.whenStable();

    const settings: HTMLElement = fixture.nativeElement.querySelector(
      "app-test-list-settings",
    );
    expect(settings?.textContent).toBe("TestEntity");
    const settingsComponent = fixture.debugElement.query(
      By.directive(TestListSettingsComponent),
    ).componentInstance as TestListSettingsComponent;
    expect(settingsComponent.entityConstructor()).toBe(TestEntity);
  });
});

@Component({
  selector: "app-test-list-settings",
  template: "{{ config().entityType }}",
})
class TestListSettingsComponent {
  entityConstructor = input.required<unknown>();
  config = input.required<EntityListConfig>();
}
