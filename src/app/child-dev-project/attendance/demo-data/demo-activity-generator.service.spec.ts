import { DemoActivityGeneratorService } from "./demo-activity-generator.service";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { RecurringActivity } from "../model/recurring-activity";
import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { DemoUserGeneratorService } from "../../../core/user/demo-user-generator.service";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { Entity } from "../../../core/entity/model/entity";

describe("DemoActivityGenerator", () => {
  let service: DemoDataGenerator<RecurringActivity>;

  beforeEach(() => {
    const mockChildGenerator = {
      entities: [TestEntity.create("John Doe")] as Entity[],
    } as DemoChildGenerator;

    const mockUserGenerator = {
      entities: [createEntityOfType("User", "test-user")] as Entity[],
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
