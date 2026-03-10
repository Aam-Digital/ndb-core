import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import { DemoDataGenerator } from "#src/app/core/demo-data/demo-data-generator";
import {
  DemoActivityEventsGeneratorService,
  DemoEventsConfig,
} from "./demo-activity-events-generator.service";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { TestBed } from "@angular/core/testing";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { AttendanceService } from "../attendance.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { AttendanceFeatureSettings } from "../model/attendance-feature-config";

describe("DemoActivityEventsGenerator", () => {
  let service: DemoDataGenerator<Entity>;

  beforeEach(() => {
    const testActivity = TestEntity.create({ name: "test-activity" });
    testActivity.refMixed = [TestEntity.create("John Doe").getId()];

    const mockActivityGenerator = {
      entities: [testActivity],
    } as unknown as DemoActivityGeneratorService;

    const mockAttendanceService = {
      featureSettings: {
        activityTypes: [
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
        recurringActivityTypes: [TestEntity],
        eventTypes: [TestEventEntity],
        filterConfig: [],
      } as AttendanceFeatureSettings,
    };

    TestBed.configureTestingModule({
      providers: [
        DemoActivityEventsGeneratorService,
        EntityRegistry,
        { provide: DemoEventsConfig, useValue: { forNLastYears: 2 } },
        {
          provide: DemoActivityGeneratorService,
          useValue: mockActivityGenerator,
        },
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    });
    service = TestBed.inject(DemoActivityEventsGeneratorService);
  });

  it("should generate entities", () => {
    expect(service.entities.length).toBeGreaterThan(500);
  });
});
