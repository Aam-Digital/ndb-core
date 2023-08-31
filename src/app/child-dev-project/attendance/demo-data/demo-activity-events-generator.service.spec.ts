import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { RecurringActivity } from "../model/recurring-activity";
import { Child } from "../../children/model/child";
import { EventNote } from "../model/event-note";
import { DemoActivityEventsGeneratorService } from "./demo-activity-events-generator.service";

describe("DemoActivityEventsGenerator", () => {
  let service: DemoDataGenerator<EventNote>;

  beforeEach(() => {
    const testActivity = RecurringActivity.create("test-activity");
    testActivity.participants.push(Child.create("John Doe").getId());

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
