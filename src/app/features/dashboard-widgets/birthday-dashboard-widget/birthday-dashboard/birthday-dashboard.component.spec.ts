import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { BirthdayDashboardComponent } from "./birthday-dashboard.component";
import {
  BirthdayDashboardIndexService,
  EntityWithBirthday,
} from "./birthday-dashboard-index.service";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import type { Mock } from "vitest";

type BirthdayDashboardIndexServiceMock = Pick<
  BirthdayDashboardIndexService,
  "buildBirthdayIndex" | "queryBirthdayIndex"
> & {
  buildBirthdayIndex: Mock<BirthdayDashboardIndexService["buildBirthdayIndex"]>;
  queryBirthdayIndex: Mock<BirthdayDashboardIndexService["queryBirthdayIndex"]>;
};

describe("BirthdayDashboardComponent", () => {
  let component: BirthdayDashboardComponent;
  let fixture: ComponentFixture<BirthdayDashboardComponent>;
  let mockIndexService: BirthdayDashboardIndexServiceMock;
  let entityMapper: EntityMapperService;

  beforeEach(waitForAsync(() => {
    mockIndexService = {
      buildBirthdayIndex: vi
        .fn()
        .mockName("mockIndexService.buildBirthdayIndex"),
      queryBirthdayIndex: vi
        .fn()
        .mockName("mockIndexService.queryBirthdayIndex"),
    };
    mockIndexService.buildBirthdayIndex.mockResolvedValue(undefined);
    mockIndexService.queryBirthdayIndex.mockResolvedValue(new Map());

    TestBed.configureTestingModule({
      imports: [BirthdayDashboardComponent, MockedTestingModule.withState()],
      providers: [
        { provide: BirthdayDashboardIndexService, useValue: mockIndexService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BirthdayDashboardComponent);
    component = fixture.componentInstance;
    entityMapper = TestBed.inject(EntityMapperService);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should combine entries from multiple configured entity types, in entities() config order", async () => {
    vi.useFakeTimers();
    try {
      @DatabaseEntity("BirthdayComponentTestEntity")
      class OtherEntity extends TestEntity {}

      const childEntry: EntityWithBirthday = {
        entity: TestEntity.create("Child"),
        birthday: new Date(2026, 8, 1),
        newAge: 8,
      };
      const otherEntry: EntityWithBirthday = {
        entity: new OtherEntity(),
        birthday: new Date(2026, 8, 5),
        newAge: 3,
      };

      mockIndexService.queryBirthdayIndex.mockResolvedValue(
        new Map([
          [OtherEntity.ENTITY_TYPE, [otherEntry]],
          [TestEntity.ENTITY_TYPE, [childEntry]],
        ]),
      );

      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
        [OtherEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      // the component just concatenates the service's per-type results in entities()
      // config order (TestEntity before OtherEntity here) - it does not recompute or
      // reorder anything itself.
      expect(component.entries()).toEqual([childEntry, otherEntry]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should pass through several entries for the same entity without further duplicating them", async () => {
    vi.useFakeTimers();
    try {
      const child = TestEntity.create("Child With Two Birthdays");
      const entryForBirthday: EntityWithBirthday = {
        entity: child,
        birthday: new Date(2026, 8, 1),
        newAge: 8,
      };
      const entryForSecondBirthday: EntityWithBirthday = {
        entity: child,
        birthday: new Date(2026, 9, 15),
        newAge: 20,
      };

      mockIndexService.queryBirthdayIndex.mockResolvedValue(
        new Map([
          [
            TestEntity.ENTITY_TYPE,
            [entryForBirthday, entryForSecondBirthday],
          ],
        ]),
      );

      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: ["dateOfBirth", "secondBirthday"],
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      // The component no longer re-derives entries per configured property - it only
      // concatenates what the service (which owns the per-property matching) returns, so
      // a real per-property entry pair from the service is not further multiplied here.
      expect(component.entries()).toEqual([
        entryForBirthday,
        entryForSecondBirthday,
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should be empty when the index does not (yet) return entities for the configured type", async () => {
    vi.useFakeTimers();
    try {
      mockIndexService.queryBirthdayIndex.mockResolvedValue(new Map());

      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.entries()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should query the index with the configured entities and threshold", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.componentRef.setInput("threshold", 14);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockIndexService.buildBirthdayIndex).toHaveBeenLastCalledWith({
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      expect(mockIndexService.queryBirthdayIndex).toHaveBeenLastCalledWith(
        { [TestEntity.ENTITY_TYPE]: "dateOfBirth" },
        14,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should pick up entities added after the initial empty query once entityMapper reports an update", async () => {
    vi.useFakeTimers();
    try {
      const child = TestEntity.create("Late Arrival");
      const childEntry: EntityWithBirthday = {
        entity: child,
        birthday: new Date(2026, 8, 20),
        newAge: 15,
      };

      mockIndexService.queryBirthdayIndex
        .mockResolvedValueOnce(new Map())
        .mockResolvedValue(new Map([[TestEntity.ENTITY_TYPE, [childEntry]]]));

      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.entries()).toEqual([]);

      await entityMapper.save(child);
      await vi.advanceTimersByTimeAsync(500);

      expect(component.entries()).toEqual([childEntry]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should only issue one additional query for multiple rapid entity updates within the debounce window", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const callCountBeforeBurst =
        mockIndexService.queryBirthdayIndex.mock.calls.length;

      await entityMapper.save(TestEntity.create("Burst Child 1"));
      await entityMapper.save(TestEntity.create("Burst Child 2"));
      await entityMapper.save(TestEntity.create("Burst Child 3"));

      await vi.advanceTimersByTimeAsync(500);

      expect(mockIndexService.queryBirthdayIndex.mock.calls.length).toBe(
        callCountBeforeBurst + 1,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not call buildBirthdayIndex again when only entity data changes (no config change)", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const buildCallCountBefore =
        mockIndexService.buildBirthdayIndex.mock.calls.length;
      const queryCallCountBefore =
        mockIndexService.queryBirthdayIndex.mock.calls.length;

      await entityMapper.save(TestEntity.create("Data Change"));
      await vi.advanceTimersByTimeAsync(500);

      expect(mockIndexService.buildBirthdayIndex.mock.calls.length).toBe(
        buildCallCountBefore,
      );
      expect(mockIndexService.queryBirthdayIndex.mock.calls.length).toBe(
        queryCallCountBefore + 1,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should unsubscribe from entity updates and stop reacting after the component is destroyed", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const queryCallCountBefore =
        mockIndexService.queryBirthdayIndex.mock.calls.length;

      fixture.destroy();

      await entityMapper.save(TestEntity.create("After Destroy"));
      await vi.advanceTimersByTimeAsync(500);

      expect(mockIndexService.queryBirthdayIndex.mock.calls.length).toBe(
        queryCallCountBefore,
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
