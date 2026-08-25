import { TestBed } from "@angular/core/testing";
import {
  BirthdayDashboardIndexService,
  EntityWithBirthday,
  getNextOccurrence,
} from "./birthday-dashboard-index.service";
import { BirthdayDashboardComponent } from "#src/app/features/dashboard-widgets/birthday-dashboard-widget/birthday-dashboard/birthday-dashboard.component";
import { DatabaseTestingModule } from "#src/app/utils/database-testing.module";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import moment from "moment/moment";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { DateWithAge } from "#src/app/core/basic-datatypes/date-with-age/dateWithAge";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";

/** Helper method to build expected results */
function expectedEntityWithBirthday(
  entity: Entity,
  dateOfBirth: Date,
): EntityWithBirthday {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birthday = getNextOccurrence(dateOfBirth, today);
  return {
    entity,
    birthday,
    newAge: birthday.getFullYear() - dateOfBirth.getFullYear(),
  };
}

describe("BirthdayDashboardIndexService", () => {
  let service: BirthdayDashboardIndexService;
  let entityMapper: EntityMapperService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayDashboardComponent, DatabaseTestingModule],
    }).compileComponents();

    entityMapper = TestBed.inject(EntityMapperService);
    service = TestBed.inject(BirthdayDashboardIndexService);
  });
  afterEach(() => TestBed.inject(DatabaseResolverService).destroyDatabases());

  it("should create", () => {
    expect(service).toBeTruthy();
  });

  it("should only return entities with birthdays until the defined threshold", async () => {
    const birthdaySoon = moment()
      .add(5, "days")
      .subtract(10, "years")
      .startOf("day");
    const child1 = new TestEntity();
    child1.dateOfBirth = new DateWithAge(birthdaySoon.toDate());
    const birthdayFarAway = moment()
      .add(5, "weeks")
      .subtract(15, "years")
      .startOf("day");
    const child2 = new TestEntity();
    child2.dateOfBirth = new DateWithAge(birthdayFarAway.toDate());
    await entityMapper.saveAll([child1, child2]);

    const entityConfig = { [TestEntity.ENTITY_TYPE]: "dateOfBirth" };
    await service.buildBirthdayIndex(entityConfig);
    const data = await service.queryBirthdayIndex(entityConfig, 31);

    expect(data).toEqual([
      expectedEntityWithBirthday(child1, child1.dateOfBirth),
    ]);
  });

  it("should sort entities according to days until next birthday", async () => {
    const firstBirthday = moment()
      .add(5, "days")
      .subtract(12, "years")
      .startOf("day");
    const child1 = new TestEntity();
    child1.dateOfBirth = new DateWithAge(firstBirthday.toDate());
    const secondBirthday = moment()
      .add(2, "weeks")
      .subtract(15, "years")
      .startOf("day");
    const child2 = new TestEntity();
    child2.dateOfBirth = new DateWithAge(secondBirthday.toDate());
    await entityMapper.saveAll([child1, child2]);

    const entityConfig = { [TestEntity.ENTITY_TYPE]: "dateOfBirth" };
    await service.buildBirthdayIndex(entityConfig);
    const data = await service.queryBirthdayIndex(entityConfig, 31);

    expect(data).toEqual([
      expectedEntityWithBirthday(child1, child1.dateOfBirth),
      expectedEntityWithBirthday(child2, child2.dateOfBirth),
    ]);
  });

  it("should not return birthdays of inactive entities", async () => {
    const birthdaySoon = moment()
      .add(3, "days")
      .subtract(9, "years")
      .startOf("day");
    const activeChild = new TestEntity();
    activeChild.dateOfBirth = new DateWithAge(birthdaySoon.toDate());
    const inactiveChild = new TestEntity();
    inactiveChild.dateOfBirth = new DateWithAge(birthdaySoon.toDate());
    inactiveChild.inactive = true;
    await entityMapper.saveAll([activeChild, inactiveChild]);

    const entityConfig = { [TestEntity.ENTITY_TYPE]: "dateOfBirth" };
    await service.buildBirthdayIndex(entityConfig);
    const data = await service.queryBirthdayIndex(entityConfig, 31);

    expect(data).toEqual([
      expectedEntityWithBirthday(activeChild, activeChild.dateOfBirth),
    ]);
  });

  it("should return entities of multiple configured types and properties in a single, globally-sorted list", async () => {
    @DatabaseEntity("BirthdayEntity")
    class BirthdayEntity extends Entity {
      @DatabaseField()
      birthday: DateWithAge;

      @DatabaseField()
      secondBirthday: DateWithAge;
    }

    const birthdayIn1Day = moment()
      .add(1, "day")
      .subtract(4, "year")
      .startOf("day");
    const birthdayIn3Days = moment()
      .add(3, "day")
      .subtract(8, "year")
      .startOf("day");
    const birthdayIn5Days = moment()
      .add(5, "day")
      .subtract(12, "year")
      .startOf("day");

    const e1 = new BirthdayEntity();
    e1.birthday = new DateWithAge(birthdayIn1Day.toDate());
    const e2 = new BirthdayEntity();
    e2.secondBirthday = new DateWithAge(birthdayIn5Days.toDate());
    const e3 = new TestEntity();
    e3.dateOfBirth = new DateWithAge(birthdayIn3Days.toDate());
    await entityMapper.saveAll([e1, e2, e3]);

    const entityConfig = {
      BirthdayEntity: ["birthday", "secondBirthday"],
      [TestEntity.ENTITY_TYPE]: "dateOfBirth",
    };

    await service.buildBirthdayIndex(entityConfig);
    const data = await service.queryBirthdayIndex(entityConfig, 31);

    expect(data).toEqual([
      expectedEntityWithBirthday(e1, e1.birthday),
      expectedEntityWithBirthday(e3, e3.dateOfBirth),
      expectedEntityWithBirthday(e2, e2.secondBirthday),
    ]);
  });

  it("should list an entity once per configured birthday property if several of its birthday properties are within the threshold", async () => {
    @DatabaseEntity("MultiBirthdayEntity")
    class MultiBirthdayEntity extends Entity {
      @DatabaseField()
      birthday: DateWithAge;

      @DatabaseField()
      secondBirthday: DateWithAge;
    }

    const birthdayIn3Days = moment()
      .add(3, "days")
      .subtract(8, "years")
      .startOf("day");
    const secondBirthdayIn5Days = moment()
      .add(5, "days")
      .subtract(30, "years")
      .startOf("day");

    const entity = new MultiBirthdayEntity();
    entity.birthday = new DateWithAge(birthdayIn3Days.toDate());
    entity.secondBirthday = new DateWithAge(secondBirthdayIn5Days.toDate());
    await entityMapper.save(entity);

    const entityConfig = {
      [MultiBirthdayEntity.ENTITY_TYPE]: ["birthday", "secondBirthday"],
    };

    await service.buildBirthdayIndex(entityConfig);
    const data = await service.queryBirthdayIndex(entityConfig, 31);

    expect(data).toEqual([
      expectedEntityWithBirthday(entity, entity.birthday),
      expectedEntityWithBirthday(entity, entity.secondBirthday),
    ]);
  });

  it("should list an entity only once if only one of its several configured birthday properties is set", async () => {
    @DatabaseEntity("PartialBirthdayEntity")
    class PartialBirthdayEntity extends Entity {
      @DatabaseField()
      birthday: DateWithAge;

      @DatabaseField()
      secondBirthday: DateWithAge;
    }

    const birthdayIn3Days = moment()
      .add(3, "days")
      .subtract(8, "years")
      .startOf("day");

    const entity = new PartialBirthdayEntity();
    entity.birthday = new DateWithAge(birthdayIn3Days.toDate());
    // secondBirthday is intentionally left unset
    await entityMapper.save(entity);

    const entityConfig = {
      [PartialBirthdayEntity.ENTITY_TYPE]: ["birthday", "secondBirthday"],
    };

    await service.buildBirthdayIndex(entityConfig);
    const data = await service.queryBirthdayIndex(entityConfig, 31);

    // The map function only emits for properties that are actually set on the doc (see
    // buildMapFunction's `if (doc.${property})` guard), so an unset configured property
    // simply contributes no index entry - the entity shows up once, for "birthday" only,
    // not twice and not omitted entirely.
    expect(data).toEqual([expectedEntityWithBirthday(entity, entity.birthday)]);
  });

  describe("boundary behavior around today and the threshold", () => {
    const entityConfig = { [TestEntity.ENTITY_TYPE]: "dateOfBirth" };
    const threshold = 10;

    /**
     * Creates a child whose birthday falls `dayOffset` days from today (relative to the
     * real, un-mocked system clock - the underlying PouchDB layer does not tolerate a
     * mocked `Date`), and asserts whether it is included in the query result.
     */
    async function expectBirthdayOffsetToBeIncluded(
      dayOffset: number,
      expectIncluded: boolean,
    ) {
      const child = new TestEntity();
      child.dateOfBirth = new DateWithAge(
        moment()
          .add(dayOffset, "days")
          .subtract(20, "years")
          .startOf("day")
          .toDate(),
      );
      await entityMapper.save(child);

      await service.buildBirthdayIndex(entityConfig);
      const data = await service.queryBirthdayIndex(entityConfig, threshold);

      expect(data).toEqual(
        expectIncluded
          ? [expectedEntityWithBirthday(child, child.dateOfBirth)]
          : [],
      );
    }

    it("should include a birthday that is today", async () => {
      await expectBirthdayOffsetToBeIncluded(0, true);
    });

    it("should report the correct age for a child born today", async () => {
      const child = new TestEntity();
      child.dateOfBirth = new DateWithAge(
        moment().subtract(20, "years").startOf("day").toDate(),
      );
      await entityMapper.save(child);

      await service.buildBirthdayIndex(entityConfig);
      const data = await service.queryBirthdayIndex(entityConfig, threshold);

      // calculateAge(dateOfBirth) alone already reflects today's birthday as having
      // happened (no decrement when month/day match exactly), so unconditionally
      // adding 1 on top of that would over-count by one specifically on the day of
      // the birthday itself.
      expect(data).toEqual([
        {
          entity: child,
          birthday: moment().startOf("day").toDate(),
          newAge: 20,
        },
      ]);
    });

    it("should not include a birthday that was yesterday", async () => {
      await expectBirthdayOffsetToBeIncluded(-1, false);
    });

    it("should not include a birthday from two days ago", async () => {
      await expectBirthdayOffsetToBeIncluded(-2, false);
    });

    it("should include a birthday exactly on the threshold", async () => {
      await expectBirthdayOffsetToBeIncluded(threshold, true);
    });

    it("should not include a birthday one day beyond the threshold", async () => {
      await expectBirthdayOffsetToBeIncluded(threshold + 1, false);
    });

    it("should not include a birthday two days beyond the threshold", async () => {
      await expectBirthdayOffsetToBeIncluded(threshold + 2, false);
    });
  });

  describe("leap-day (Feb 29) birthdays", () => {
    const entityConfig = { [TestEntity.ENTITY_TYPE]: "dateOfBirth" };

    /**
     * Number of days from today until the next occurrence of the given (1-indexed) month/day,
     * computed against the real system clock so the test stays deterministic without mocking
     * `Date` (which the underlying PouchDB layer does not tolerate).
     */
    function daysUntilNextOccurrenceOf(month: number, day: number): number {
      const today = moment().startOf("day");
      const target = moment(today)
        .month(month - 1)
        .date(day);
      if (target.isBefore(today)) {
        target.add(1, "year");
      }
      return target.diff(today, "days");
    }

    it("should include a Feb 29 birthday once the threshold reaches the next March 1", async () => {
      // The index maps month/day onto a fixed non-leap reference year, where Feb 29
      // rolls over to March 1 - so a Feb 29 birthday becomes findable exactly when a
      // real, ordinary March 1 birthday would be.
      const daysUntilMarch1 = daysUntilNextOccurrenceOf(3, 1);

      const child = new TestEntity();
      child.dateOfBirth = new DateWithAge(moment("2000-02-29").toDate());
      await entityMapper.save(child);

      await service.buildBirthdayIndex(entityConfig);
      const data = await service.queryBirthdayIndex(
        entityConfig,
        daysUntilMarch1,
      );

      expect(data).toEqual([
        expectedEntityWithBirthday(child, child.dateOfBirth),
      ]);
    });

    it("should treat a Feb 29 birthday (leap year) the same as its folded equivalent, March 1 (non-leap year)", async () => {
      const daysUntilMarch1 = daysUntilNextOccurrenceOf(3, 1);

      const leapYearChild = new TestEntity();
      leapYearChild.dateOfBirth = new DateWithAge(
        moment("2000-02-29").toDate(), // 2000 is a leap year
      );
      const nonLeapYearChild = new TestEntity();
      nonLeapYearChild.dateOfBirth = new DateWithAge(
        moment("2001-03-01").toDate(), // 2001 is not a leap year
      );
      await entityMapper.saveAll([leapYearChild, nonLeapYearChild]);

      await service.buildBirthdayIndex(entityConfig);
      const data = await service.queryBirthdayIndex(
        entityConfig,
        daysUntilMarch1,
      );

      expect(data).toEqual(
        expect.arrayContaining([
          expectedEntityWithBirthday(leapYearChild, leapYearChild.dateOfBirth),
          expectedEntityWithBirthday(
            nonLeapYearChild,
            nonLeapYearChild.dateOfBirth,
          ),
        ]),
      );
      expect(data).toHaveLength(2);
    });

    it("should not include a birthday from March 2, two days beyond the Feb 29 / March 1 boundary", async () => {
      const daysUntilMarch1 = daysUntilNextOccurrenceOf(3, 1);

      const child = new TestEntity();
      child.dateOfBirth = new DateWithAge(moment("2001-03-02").toDate());
      await entityMapper.save(child);

      await service.buildBirthdayIndex(entityConfig);
      const data = await service.queryBirthdayIndex(
        entityConfig,
        daysUntilMarch1,
      );

      expect(data).toEqual([]);
    });
  });
});
