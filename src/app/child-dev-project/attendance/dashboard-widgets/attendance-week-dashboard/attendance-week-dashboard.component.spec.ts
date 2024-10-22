import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EventNote } from "../../model/event-note";
import { defaultAttendanceStatusTypes } from "../../../../core/config/default-config/default-attendance-status-types";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { ActivityAttendance } from "../../model/activity-attendance";
import { AttendanceService } from "../../attendance.service";
import { RecurringActivity } from "../../model/recurring-activity";
import moment from "moment";
import * as MockDate from "mockdate";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("AttendanceWeekDashboardComponent", () => {
  let component: AttendanceWeekDashboardComponent;
  let fixture: ComponentFixture<AttendanceWeekDashboardComponent>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(waitForAsync(() => {
    mockAttendanceService = jasmine.createSpyObj([
      "getAllActivityAttendancesForPeriod",
    ]);
    mockAttendanceService.getAllActivityAttendancesForPeriod.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [
        AttendanceWeekDashboardComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceWeekDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display children with low attendance", async () => {
    const absentChild = new TestEntity();
    const presentChild = new TestEntity();
    const mondayLastWeek = moment().startOf("isoWeek").subtract(7, "days");
    const e1 = EventNote.create(mondayLastWeek.toDate());
    const e2 = EventNote.create(moment(e1.date).add(1, "day").toDate());
    const presentStatus = defaultAttendanceStatusTypes.find(
      (s) => s.countAs === AttendanceLogicalStatus.PRESENT,
    );
    const absentStatus = defaultAttendanceStatusTypes.find(
      (s) => s.countAs === AttendanceLogicalStatus.ABSENT,
    );
    [e1, e2].forEach((e) => {
      e.addChild(absentChild);
      e.getAttendance(absentChild).status = absentStatus;
      e.addChild(presentChild);
      e.getAttendance(presentChild).status = presentStatus;
    });
    const activity = new RecurringActivity();
    activity.participants = e1.children;
    const attendance = ActivityAttendance.create(new Date(), [e1, e2]);
    attendance.activity = activity;
    mockAttendanceService.getAllActivityAttendancesForPeriod.and.resolveTo([
      attendance,
    ]);

    await component.ngOnInit();

    expect(component.entries).toEqual([
      [
        {
          childId: absentChild.getId(),
          activity: activity,
          attendanceDays: [
            // sundays are excluded
            e1.getAttendance(absentChild),
            e2.getAttendance(absentChild),
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        },
      ],
    ]);
  });

  it("should display children also if added via activity group or manually", async () => {
    const absentChild = new TestEntity();
    const mondayLastWeek = moment().startOf("isoWeek").subtract(7, "days");
    const e1 = EventNote.create(mondayLastWeek.toDate());
    const e2 = EventNote.create(moment(e1.date).add(1, "day").toDate());
    const absentStatus = defaultAttendanceStatusTypes.find(
      (s) => s.countAs === AttendanceLogicalStatus.ABSENT,
    );
    [e1, e2].forEach((e) => {
      e.addChild(absentChild);
      e.getAttendance(absentChild).status = absentStatus;
    });
    const activity = new RecurringActivity();
    delete activity.participants; // no participants set directly on RecurringActivity
    const attendance = ActivityAttendance.create(new Date(), [e1, e2]);
    attendance.activity = activity;
    mockAttendanceService.getAllActivityAttendancesForPeriod.and.resolveTo([
      attendance,
    ]);

    await component.ngOnInit();

    expect(component.entries).toEqual([
      [
        {
          childId: absentChild.getId(),
          activity: activity,
          attendanceDays: [
            // sundays are excluded
            e1.getAttendance(absentChild),
            e2.getAttendance(absentChild),
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        },
      ],
    ]);
  });

  function expectTimePeriodCalled(from: moment.Moment, to: moment.Moment) {
    mockAttendanceService.getAllActivityAttendancesForPeriod.calls.reset();

    component.ngOnInit();

    expect(
      mockAttendanceService.getAllActivityAttendancesForPeriod,
    ).toHaveBeenCalledWith(from.toDate(), to.toDate());
  }

  it("should correctly use the offset", () => {
    // default case: last week monday till saturday

    // on Monday, that's the first day of the current period
    MockDate.set(moment("2023-11-20").toDate());
    const mondayLastWeek = moment("2023-11-13");
    const saturdayLastWeek = moment("2023-11-18");
    expectTimePeriodCalled(mondayLastWeek, saturdayLastWeek);

    // on Sunday, that's the still the last day of the currently ending period
    MockDate.set(moment("2023-11-26").toDate());
    const mondayLastWeek2 = moment("2023-11-13");
    const saturdayLastWeek2 = moment("2023-11-18");
    expectTimePeriodCalled(mondayLastWeek2, saturdayLastWeek2);

    // with offset: this week monday till saturday
    MockDate.set(moment("2023-11-20").toDate());
    const mondayThisWeek = moment("2023-11-20");
    const saturdayThisWeek = moment("2023-11-25");
    component.daysOffset = 7;
    expectTimePeriodCalled(mondayThisWeek, saturdayThisWeek);

    MockDate.reset();
  });
});
