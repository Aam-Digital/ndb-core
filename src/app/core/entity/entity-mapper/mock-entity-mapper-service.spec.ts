import {
  mockEntityMapper,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";
import { Child } from "../../../child-dev-project/children/model/child";
import { expectObservable } from "../../../utils/test-utils/observable-utils";

describe("MockEntityMapperServicer", () => {
  let service: MockEntityMapperService;
  beforeEach(() => {
    service = mockEntityMapper();
  });

  it("should publish a update for a newly added entity", (done) => {
    const child = new Child();

    expectObservable(service.receiveUpdates(Child))
      .first.toBeResolvedTo({ type: "new", entity: child })
      .then(() => done());
    service.add(child);
  });

  it("should publish a update for a already existing entities", (done) => {
    const child = new Child();
    service.add(child);

    child.name = "Updated name";
    expectObservable(service.receiveUpdates(Child))
      .first.toBeResolvedTo({ type: "update", entity: child })
      .then(() => done());
    service.add(child);
  });
});
