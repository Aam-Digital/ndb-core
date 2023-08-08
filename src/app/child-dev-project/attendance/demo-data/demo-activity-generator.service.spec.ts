import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { RecurringActivity } from "../model/recurring-activity";
import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { DemoUserGeneratorService } from "../../../core/user/demo-user-generator.service";
import { Child } from "../../children/model/child";
import { User } from "../../../core/user/user";

describe("DemoActivityGenerator", () => {
  let service: DemoDataGenerator<RecurringActivity>;

  beforeEach(() => {
    const mockChildGenerator = {
      entities: [Child.create("John Doe")],
    } as DemoChildGenerator;

    const mockUserGenerator = {
      entities: [new User("test-user")],
    } as DemoUserGeneratorService;

    service = new DemoActivityGeneratorService(
      mockChildGenerator,
      mockUserGenerator,
    );
  });

  it("should generate entities", () => {
    expect(service.entities).toBeDefined();
  });
});
