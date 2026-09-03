import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { BirthdayDashboardComponent } from "./birthday-dashboard.component";
import {
  BirthdayDashboardIndexService,
  EntityWithBirthday,
} from "./birthday-dashboard-index.service";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
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
    mockIndexService.queryBirthdayIndex.mockResolvedValue([]);

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

  it("should expose exactly what the index service returns, in the returned order", async () => {
    vi.useFakeTimers();
    try {
      // the service already owns combining/sorting entries across all configured entity
      // types and properties (including several entries for the same entity, one per
      // matching property), so the component is a pure pass-through: no re-derivation,
      // re-combination, or re-sorting happens here.
      const sameEntity = TestEntity.create("Child With Two Birthdays");
      const entries: EntityWithBirthday[] = [
        {
          entity: TestEntity.create("First"),
          birthday: new Date(2026, 8, 1),
          newAge: 8,
        },
        { entity: sameEntity, birthday: new Date(2026, 8, 5), newAge: 3 },
        { entity: sameEntity, birthday: new Date(2026, 9, 15), newAge: 20 },
      ];
      mockIndexService.queryBirthdayIndex.mockResolvedValue(entries);

      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: ["dateOfBirth", "secondBirthday"],
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.entries()).toEqual(entries);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should be empty when the index does not (yet) return any entries", async () => {
    vi.useFakeTimers();
    try {
      mockIndexService.queryBirthdayIndex.mockResolvedValue([]);

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
        .mockResolvedValueOnce([])
        .mockResolvedValue([childEntry]);

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
