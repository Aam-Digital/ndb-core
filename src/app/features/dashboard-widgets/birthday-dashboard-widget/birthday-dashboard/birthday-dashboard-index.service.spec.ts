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
});
