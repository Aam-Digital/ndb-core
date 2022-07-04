import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { BirthdayDashboardComponent } from "./birthday-dashboard.component";
import { ChildrenModule } from "../../children.module";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import moment from "moment";
import { ConfigService } from "../../../../core/config/config.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("BirthdayDashboardComponent", () => {
  let component: BirthdayDashboardComponent;
  let fixture: ComponentFixture<BirthdayDashboardComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType", "load"]);
    mockEntityMapper.loadType.and.resolveTo([]);
    await TestBed.configureTestingModule({
      imports: [ChildrenModule, FontAwesomeTestingModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: ConfigService, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BirthdayDashboardComponent);
    component = fixture.componentInstance;
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
    const child1 = new Child();
    child1.dateOfBirth = birthdaySoon.toDate();
    const birthdayFarAway = moment()
      .subtract(15, "years")
      .add(5, "weeks")
      .startOf("day");
    const child2 = new Child();
    child2.dateOfBirth = birthdayFarAway.toDate();
    mockEntityMapper.loadType.and.resolveTo([child1, child2]);

    component.ngOnInit();
    tick();

    const expectedNextBirthday = birthdaySoon.add(10, "years");
    expect(component.childrenDataSource.data).toEqual([
      { child: child1, birthday: expectedNextBirthday.toDate() },
    ]);
  }));

  it("should sort birthdays correctly", fakeAsync(() => {
    const firstBirthday = moment()
      .subtract(12, "years")
      .add(5, "days")
      .startOf("day");
    const child1 = new Child();
    child1.dateOfBirth = firstBirthday.toDate();
    const secondBirthday = moment()
      .subtract(15, "years")
      .add(2, "weeks")
      .startOf("day");
    const child2 = new Child();
    child2.dateOfBirth = secondBirthday.toDate();
    mockEntityMapper.loadType.and.resolveTo([child1, child2]);

    component.ngOnInit();
    tick();

    const expectedFirstBirthday = firstBirthday.add(12, "years");
    const expectedSecondBirthday = secondBirthday.add(15, "years");
    expect(component.childrenDataSource.data).toEqual([
      { child: child1, birthday: expectedFirstBirthday.toDate() },
      { child: child2, birthday: expectedSecondBirthday.toDate() },
    ]);
  }));
});
