import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import { DemoDataGenerator } from "#src/app/core/demo-data/demo-data-generator";
import { RecurringActivity } from "../model/recurring-activity";
import { EventNote } from "../model/event-note";
import {
  DemoActivityEventsGeneratorService,
  DemoEventsConfig,
} from "./demo-activity-events-generator.service";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { TestBed } from "@angular/core/testing";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";

describe("DemoActivityEventsGenerator", () => {
  let service: DemoDataGenerator<EventNote>;

  beforeEach(() => {
    const testActivity = RecurringActivity.create("test-activity");
    testActivity.participants.push(TestEntity.create("John Doe").getId());

    const mockActivityGenerator = {
      entities: [testActivity],
    } as DemoActivityGeneratorService;

    TestBed.configureTestingModule({
      providers: [
        DemoActivityEventsGeneratorService,
        EntityRegistry,
        { provide: DemoEventsConfig, useValue: { forNLastYears: 2 } },
        {
          provide: DemoActivityGeneratorService,
          useValue: mockActivityGenerator,
        },
      ],
    });
    service = TestBed.inject(DemoActivityEventsGeneratorService);
  });

  it("should generate entities", () => {
    expect(service.entities.length).toBeGreaterThan(500);
  });
});
