import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { RecurringActivity } from "../model/recurring-activity";
import { EventNote } from "../model/event-note";
import { DemoActivityEventsGeneratorService } from "./demo-activity-events-generator.service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("DemoActivityEventsGenerator", () => {
  let service: DemoDataGenerator<EventNote>;

  beforeEach(() => {
    const testActivity = RecurringActivity.create("test-activity");
    testActivity.participants.push(TestEntity.create("John Doe").getId());

    const mockActivityGenerator = {
      entities: [testActivity],
    } as DemoActivityGeneratorService;

    service = new DemoActivityEventsGeneratorService(
      { forNLastYears: 2 },
      mockActivityGenerator,
    );
  });

  it("should generate entities", () => {
    expect(service.entities.length).toBeGreaterThan(500);
  });
});
