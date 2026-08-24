import { TestBed } from "@angular/core/testing";
import { BirthdayDashboardIndexService } from "./birthday-dashboard-index.service";
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

    expect(data.get(TestEntity.ENTITY_TYPE)).toEqual([child1]);
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

    expect(data.get(TestEntity.ENTITY_TYPE)).toEqual([child1, child2]);
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

    expect(data.get(TestEntity.ENTITY_TYPE)).toEqual([activeChild]);
  });

  it("should support multiple entity types with multiple, different properties tracking a date of birth", async () => {
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

    expect(data.get(TestEntity.ENTITY_TYPE)).toEqual([e3]);
    expect(data.get(BirthdayEntity.ENTITY_TYPE)).toEqual([e1, e2]);
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

    // The map function emits one index entry per configured, matching property, so an entity
    // with several upcoming birthdays currently shows up multiple times in the result - once
    // per property, ordered by that property's days-until-birthday (here: "birthday" before
    // "secondBirthday").
    expect(data.get(MultiBirthdayEntity.ENTITY_TYPE)).toEqual([
      entity,
      entity,
    ]);
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

      expect(data.get(TestEntity.ENTITY_TYPE)).toEqual(
        expectIncluded ? [child] : [],
      );
    }

    it("should include a birthday that is today", async () => {
      await expectBirthdayOffsetToBeIncluded(0, true);
    });

    it("should include a birthday that was yesterday (index padding)", async () => {
      await expectBirthdayOffsetToBeIncluded(-1, true);
    });

    it("should not include a birthday from two days ago", async () => {
      await expectBirthdayOffsetToBeIncluded(-2, false);
    });

    it("should include a birthday exactly on the threshold", async () => {
      await expectBirthdayOffsetToBeIncluded(threshold, true);
    });

    it("should include a birthday one day beyond the threshold (index padding)", async () => {
      await expectBirthdayOffsetToBeIncluded(threshold + 1, true);
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

      expect(data.get(TestEntity.ENTITY_TYPE)).toEqual([child]);
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

      expect(data.get(TestEntity.ENTITY_TYPE)).toEqual(
        expect.arrayContaining([leapYearChild, nonLeapYearChild]),
      );
      expect(data.get(TestEntity.ENTITY_TYPE)).toHaveLength(2);
    });

    it("should not include a birthday from March 3, three days beyond the Feb 29 / March 1 boundary", async () => {
      const daysUntilMarch1 = daysUntilNextOccurrenceOf(3, 1);

      const child = new TestEntity();
      child.dateOfBirth = new DateWithAge(moment("2001-03-03").toDate());
      await entityMapper.save(child);

      await service.buildBirthdayIndex(entityConfig);
      const data = await service.queryBirthdayIndex(
        entityConfig,
        daysUntilMarch1,
      );

      expect(data.get(TestEntity.ENTITY_TYPE)).toEqual([]);
    });
  });
});
