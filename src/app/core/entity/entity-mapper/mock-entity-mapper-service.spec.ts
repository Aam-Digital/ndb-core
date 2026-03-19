import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { TestBed } from "@angular/core/testing";
import { EntityMapperService } from "./entity-mapper.service";
import { entityRegistry, EntityRegistry } from "../database-entity.decorator";
import { firstValueFrom } from "rxjs";

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
    const nextUpdate = firstValueFrom(service.receiveUpdates(TestEntity));
    service.add(child);
    await expect(nextUpdate).resolves.toEqual({ type: "new", entity: child });
  });

  it("should publish a update for a already existing entities", async () => {
    const child = new TestEntity();
    service.add(child);

    child.name = "Updated name";
    const nextUpdate = firstValueFrom(service.receiveUpdates(TestEntity));
    service.add(child);
    await expect(nextUpdate).resolves.toEqual({
      type: "update",
      entity: child,
    });
  });
});
