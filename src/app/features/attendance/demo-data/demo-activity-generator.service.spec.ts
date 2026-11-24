import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import { DemoDataGenerator } from "#src/app/core/demo-data/demo-data-generator";
import { DemoEntityStore } from "#src/app/core/demo-data/generic/demo-entity-store";
import { DemoUserGeneratorService } from "#src/app/core/user/demo-user-generator.service";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { Entity } from "#src/app/core/entity/model/entity";
import { TestBed } from "@angular/core/testing";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { AttendanceService } from "../attendance.service";
import { GenericDemoDataEngine } from "#src/app/core/demo-data/generic/generic-demo-data-engine";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";

describe("DemoActivityGenerator", () => {
  let service: DemoDataGenerator<Entity>;

  beforeEach(() => {
    const demoEntities = new DemoEntityStore();
    demoEntities.set("Child", [TestEntity.create("John Doe")]);

    const mockUserGenerator = {
      entities: [createEntityOfType("User", "test-user")] as Entity[],
    } as DemoUserGeneratorService;

    const mockAttendanceService = {
      eventTypeSettings: [
        {
          activityType: TestEntity,
          eventType: TestEventEntity,
          participantsField: "refMixed",
          dateField: undefined,
          relatesToField: "relatesTo",
          assignedUsersField: "authors",
          filterConfig: [],
          extraField: "",
          fieldMapping: {
            title: "name",
          },
        },
      ],
    };

    TestBed.configureTestingModule({
      providers: [
        DemoActivityGeneratorService,
        EntityRegistry,
        { provide: DemoEntityStore, useValue: demoEntities },
        { provide: DemoUserGeneratorService, useValue: mockUserGenerator },
        { provide: AttendanceService, useValue: mockAttendanceService },
        {
          provide: GenericDemoDataEngine,
          useValue: { fillRemainingFields: () => undefined },
        },
      ],
    });
    service = TestBed.inject(DemoActivityGeneratorService);
  });

  it("should generate entities", () => {
    expect(service.entities).toBeDefined();
    expect(service.entities.length).toBeGreaterThan(0);
  });
});
