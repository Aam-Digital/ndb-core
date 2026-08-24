import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import moment from "moment";

import { BirthdayDashboardComponent } from "./birthday-dashboard.component";
import { BirthdayDashboardIndexService } from "./birthday-dashboard-index.service";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { DateWithAge } from "#src/app/core/basic-datatypes/date-with-age/dateWithAge";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import type { Mock } from "vitest";

type BirthdayDashboardIndexServiceMock = Pick<
  BirthdayDashboardIndexService,
  "buildBirthdayIndex" | "queryBirthdayIndex"
> & {
  buildBirthdayIndex: Mock<
    BirthdayDashboardIndexService["buildBirthdayIndex"]
  >;
  queryBirthdayIndex: Mock<BirthdayDashboardIndexService["queryBirthdayIndex"]>;
};

/** Mirrors the private `getNextBirthday` logic of the component for use in test expectations. */
function expectedNextBirthday(dateOfBirth: Date): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birthday = new Date(
    today.getFullYear(),
    dateOfBirth.getMonth(),
    dateOfBirth.getDate(),
  );
  if (today.getTime() > birthday.getTime()) {
    birthday.setFullYear(birthday.getFullYear() + 1);
  }
  return birthday;
}

describe("BirthdayDashboardComponent", () => {
  let component: BirthdayDashboardComponent;
  let fixture: ComponentFixture<BirthdayDashboardComponent>;
  let mockIndexService: BirthdayDashboardIndexServiceMock;

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
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create one entry per entity for a single configured birthday property", async () => {
    vi.useFakeTimers();
    try {
      const child1 = TestEntity.create("First Child");
      child1.dateOfBirth = new DateWithAge(
        moment().subtract(10, "years").add(5, "days").toDate(),
      );
      const child2 = TestEntity.create("Second Child");
      child2.dateOfBirth = new DateWithAge(
        moment().subtract(8, "years").add(20, "days").toDate(),
      );
      mockIndexService.queryBirthdayIndex.mockResolvedValue(
        new Map([[TestEntity.ENTITY_TYPE, [child1, child2]]]),
      );

      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.entries()).toEqual([
        {
          entity: child1,
          birthday: expectedNextBirthday(child1.dateOfBirth),
          newAge: child1.dateOfBirth.age + 1,
        },
        {
          entity: child2,
          birthday: expectedNextBirthday(child2.dateOfBirth),
          newAge: child2.dateOfBirth.age + 1,
        },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should create one entry per configured property for entities with several birthday properties", async () => {
    vi.useFakeTimers();
    try {
      const child = TestEntity.create("Child With Two Birthdays");
      child.dateOfBirth = new DateWithAge(
        moment().subtract(10, "years").add(5, "days").toDate(),
      );
      const secondBirthday = new DateWithAge(
        moment().subtract(20, "years").add(15, "days").toDate(),
      );
      (child as unknown as Record<string, unknown>).secondBirthday =
        secondBirthday;

      mockIndexService.queryBirthdayIndex.mockResolvedValue(
        new Map([[TestEntity.ENTITY_TYPE, [child]]]),
      );

      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: ["dateOfBirth", "secondBirthday"],
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      // the entity has an upcoming birthday for both configured properties, so it is
      // represented by one entry per property, each with that property's own birthday/newAge.
      expect(component.entries()).toEqual([
        {
          entity: child,
          birthday: expectedNextBirthday(child.dateOfBirth),
          newAge: child.dateOfBirth.age + 1,
        },
        {
          entity: child,
          birthday: expectedNextBirthday(secondBirthday),
          newAge: secondBirthday.age + 1,
        },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should combine entries from multiple configured entity types", async () => {
    vi.useFakeTimers();
    try {
      @DatabaseEntity("BirthdayComponentTestEntity")
      class OtherEntity extends TestEntity {
        static override ENTITY_TYPE = "BirthdayComponentTestEntity";
      }

      const child = TestEntity.create("Child");
      child.dateOfBirth = new DateWithAge(
        moment().subtract(6, "years").add(3, "days").toDate(),
      );
      const other = new OtherEntity();
      other.dateOfBirth = new DateWithAge(
        moment().subtract(2, "years").add(9, "days").toDate(),
      );

      mockIndexService.queryBirthdayIndex.mockResolvedValue(
        new Map([
          [TestEntity.ENTITY_TYPE, [child]],
          [OtherEntity.ENTITY_TYPE, [other]],
        ]),
      );

      fixture.componentRef.setInput("entities", {
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
        [OtherEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.entries()).toEqual(
        expect.arrayContaining([
          {
            entity: child,
            birthday: expectedNextBirthday(child.dateOfBirth),
            newAge: child.dateOfBirth.age + 1,
          },
          {
            entity: other,
            birthday: expectedNextBirthday(other.dateOfBirth),
            newAge: other.dateOfBirth.age + 1,
          },
        ]),
      );
      expect(component.entries()).toHaveLength(2);
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
});
