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
    const birthdaySoon = moment()
      .subtract(10, "years")
      .add(5, "days")
      .startOf("day");
    const child1 = new TestEntity();
    child1.dateOfBirth = new DateWithAge(birthdaySoon.toDate());
    const birthdayFarAway = moment()
      .subtract(15, "years")
      .add(5, "weeks")
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
      .subtract(12, "years")
      .add(5, "days")
      .startOf("day");
    const child1 = new TestEntity();
    child1.dateOfBirth = new DateWithAge(firstBirthday.toDate());
    const secondBirthday = moment()
      .subtract(15, "years")
      .add(2, "weeks")
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
      @DatabaseField() birthday: DateWithAge;
    }

    const e1 = new BirthdayEntity();
    e1.birthday = new DateWithAge(
      moment().subtract(4, "year").add(1, "day").toDate(),
    );
    const e2 = new BirthdayEntity();
    e2.birthday = new DateWithAge(
      moment().subtract(12, "year").add(3, "day").toDate(),
    );
    const e3 = new TestEntity();
    e3.dateOfBirth = new DateWithAge(
      moment().subtract(8, "year").add(2, "day").toDate(),
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
