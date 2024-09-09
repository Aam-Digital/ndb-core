import {
  mockEntityMapper,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";
import { expectObservable } from "../../../utils/test-utils/observable-utils";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("MockEntityMapperServicer", () => {
  let service: MockEntityMapperService;
  beforeEach(() => {
    service = mockEntityMapper();
  });

  it("should publish a update for a newly added entity", (done) => {
    const child = new TestEntity();

    expectObservable(service.receiveUpdates(TestEntity))
      .first.toBeResolvedTo({ type: "new", entity: child })
      .then(() => done());
    service.add(child);
  });

  it("should publish a update for a already existing entities", (done) => {
    const child = new TestEntity();
    service.add(child);

    child.name = "Updated name";
    expectObservable(service.receiveUpdates(TestEntity))
      .first.toBeResolvedTo({ type: "update", entity: child })
      .then(() => done());
    service.add(child);
  });
});
