import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

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
          useValue: { entityRegistry },
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

    component.entities = { [TestEntity.ENTITY_TYPE]: "dateOfBirth" };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only show birthdays in the next 31 days", fakeAsync(() => {
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

    component.ngOnInit();
    tick();

    const expectedNextBirthday = birthdaySoon.add(10, "years");
    expect(component.entries).toEqual([
      { entity: child1, birthday: expectedNextBirthday.toDate(), newAge: 10 },
    ]);
  }));

  it("should sort birthdays correctly", fakeAsync(() => {
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

    component.ngOnInit();
    tick();

    const expectedFirstBirthday = firstBirthday.add(12, "years");
    const expectedSecondBirthday = secondBirthday.add(15, "years");
    expect(component.entries).toEqual([
      { entity: child1, birthday: expectedFirstBirthday.toDate(), newAge: 12 },
      { entity: child2, birthday: expectedSecondBirthday.toDate(), newAge: 15 },
    ]);
  }));

  it("should support multiple entities types ", fakeAsync(() => {
    @DatabaseEntity("BirthdayEntity")
    class BirthdayEntity extends Entity {
      @DatabaseField()
      birthday: DateWithAge;
    }

    const e1 = new BirthdayEntity();
    e1.birthday = new DateWithAge(
      moment().add(1, "day").subtract(4, "year").toDate(),
    );
    const e2 = new BirthdayEntity();
    e2.birthday = new DateWithAge(
      moment().add(3, "day").subtract(12, "year").toDate(),
    );
    const e3 = new TestEntity();
    e3.dateOfBirth = new DateWithAge(
      moment().add(2, "day").subtract(8, "year").toDate(),
    );
    entityMapper.saveAll([e1, e2, e3]);

    component.entities = {
      BirthdayEntity: "birthday",
      [TestEntity.ENTITY_TYPE]: "dateOfBirth",
    };
    component.ngOnInit();
    tick();

    expect(component.entries).toEqual([
      {
        entity: e1,
        birthday: moment().add(1, "day").startOf("day").toDate(),
        newAge: 4,
      },
      {
        entity: e3,
        birthday: moment().add(2, "day").startOf("day").toDate(),
        newAge: 8,
      },
      {
        entity: e2,
        birthday: moment().add(3, "day").startOf("day").toDate(),
        newAge: 12,
      },
    ]);
  }));
});
