import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BirthdayDashboardComponent } from "./birthday-dashboard.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import moment from "moment";
import { ConfigService } from "../../../../core/config/config.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Entity } from "../../../../core/entity/model/entity";
import { DatabaseField } from "../../../../core/entity/database-field.decorator";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../../../../core/entity/entity-mapper/mock-entity-mapper-service";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../../../core/entity/database-entity.decorator";
import { DateWithAge } from "../../../../core/basic-datatypes/date-with-age/dateWithAge";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { EntityConfigService } from "../../../../core/entity/entity-config.service";

describe("BirthdayDashboardComponent", () => {
  let component: BirthdayDashboardComponent;
  let fixture: ComponentFixture<BirthdayDashboardComponent>;
  let entityMapper: MockEntityMapperService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayDashboardComponent, FontAwesomeTestingModule],
      providers: [
        ...mockEntityMapperProvider(),
        { provide: ConfigService, useValue: {} },
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        {
          provide: EntityConfigService,
          useValue: {
            getRuntimeRoute: (entityType: typeof Entity) => entityType.route,
          },
        },
      ],
    }).compileComponents();

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BirthdayDashboardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("entities", {
      [TestEntity.ENTITY_TYPE]: "dateOfBirth",
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only show birthdays in the next 31 days", async () => {
    vi.useFakeTimers();
    try {
      // add days before subtracting years to avoid landing on Feb 29 of a leap year,
      // which moment and JS Date handle differently when mapping back to a non-leap year
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
      entityMapper.saveAll([child1, child2]);

      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const expectedNextBirthday = birthdaySoon.add(10, "years");
      expect(component.entries()).toEqual([
        { entity: child1, birthday: expectedNextBirthday.toDate(), newAge: 10 },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should sort birthdays correctly", async () => {
    vi.useFakeTimers();
    try {
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
      entityMapper.saveAll([child1, child2]);

      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const expectedFirstBirthday = firstBirthday.add(12, "years");
      const expectedSecondBirthday = secondBirthday.add(15, "years");
      expect(component.entries()).toEqual([
        {
          entity: child1,
          birthday: expectedFirstBirthday.toDate(),
          newAge: 12,
        },
        {
          entity: child2,
          birthday: expectedSecondBirthday.toDate(),
          newAge: 15,
        },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should support multiple entities types ", async () => {
    vi.useFakeTimers();
    try {
      @DatabaseEntity("BirthdayEntity")
      class BirthdayEntity extends Entity {
        @DatabaseField()
        birthday: DateWithAge;
      }

      // Use wider day gaps to keep sort order stable across DST/timezones.
      // Add days before subtracting years and normalize to start of day
      // to avoid leap-day and local-time edge cases.
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
      e2.birthday = new DateWithAge(birthdayIn5Days.toDate());
      const e3 = new TestEntity();
      e3.dateOfBirth = new DateWithAge(birthdayIn3Days.toDate());
      entityMapper.saveAll([e1, e2, e3]);

      fixture.componentRef.setInput("entities", {
        BirthdayEntity: "birthday",
        [TestEntity.ENTITY_TYPE]: "dateOfBirth",
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.entries()).toEqual([
        {
          entity: e1,
          birthday: birthdayIn1Day.clone().add(4, "year").toDate(),
          newAge: 4,
        },
        {
          entity: e3,
          birthday: birthdayIn3Days.clone().add(8, "year").toDate(),
          newAge: 8,
        },
        {
          entity: e2,
          birthday: birthdayIn5Days.clone().add(12, "year").toDate(),
          newAge: 12,
        },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});
