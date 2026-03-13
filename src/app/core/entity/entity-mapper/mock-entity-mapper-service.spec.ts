import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";
import { expectObservable } from "../../../utils/test-utils/observable-utils";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { TestBed } from "@angular/core/testing";
import { EntityMapperService } from "./entity-mapper.service";
import { entityRegistry, EntityRegistry } from "../database-entity.decorator";

describe("MockEntityMapperServicer", () => {
  let service: MockEntityMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...mockEntityMapperProvider([]),
        {
          provide: EntityRegistry,
          useValue: { entityRegistry },
        },
      ],
    });
    service = TestBed.inject(EntityMapperService) as MockEntityMapperService;
  });

  it("should publish a update for a newly added entity", async () => {
    const child = new TestEntity();
    const nextUpdate = expectObservable(service.receiveUpdates(TestEntity))
      .first.toBeResolvedTo({ type: "new", entity: child })
      .then(() => {});
    service.add(child);
    await nextUpdate;
  });

  it("should publish a update for a already existing entities", async () => {
    const child = new TestEntity();
    service.add(child);

    child.name = "Updated name";
    const nextUpdate = expectObservable(service.receiveUpdates(TestEntity))
      .first.toBeResolvedTo({ type: "update", entity: child })
      .then(() => {});
    service.add(child);
    await nextUpdate;
  });
});
