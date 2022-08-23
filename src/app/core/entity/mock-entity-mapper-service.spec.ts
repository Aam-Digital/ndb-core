import { mockEntityMapper, MockEntityMapperService } from "./mock-entity-mapper-service";
import { Child } from "../../child-dev-project/children/model/child";

describe("MockEntityMapperServicer", () => {
  let service: MockEntityMapperService;
  beforeEach(() => {
    service = mockEntityMapper();
  });

  it("should publish a update for a newly added entity", (done) => {
    const child = new Child();
    service.receiveUpdates(Child.ENTITY_TYPE).subscribe((update) => {
      expect(update.entity).toEqual(child);
      expect(update.type).toBe("new");
      done();
    });

    service.add(child);
  });

  it("should publish a update for a already existing entities", (done) => {
    const child = new Child();
    service.add(child);

    child.name = "Updated name";
    service.receiveUpdates(Child.ENTITY_TYPE).subscribe((update) => {
      expect(update.entity).toEqual(child);
      expect(update.type).toBe("update");
      done();
    });
    service.add(child);
  });
});
