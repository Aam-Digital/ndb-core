import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { Child } from "../../../children/model/child";
import { EventNote } from "../../model/event-note";
import { defaultAttendanceStatusTypes } from "../../../../core/config/default-config/default-attendance-status-types";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { ActivityAttendance } from "../../model/activity-attendance";
import { AttendanceService } from "../../attendance.service";
import { RecurringActivity } from "../../model/recurring-activity";
import moment from "moment";

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
    const absentChild = new Child();
    const presentChild = new Child();
    const mondayLastWeek = moment().startOf("isoWeek").subtract(7, "days");
    const e1 = EventNote.create(mondayLastWeek.toDate());
    const e2 = EventNote.create(moment(e1.date).add(1, "day").toDate());
    const presentStatus = defaultAttendanceStatusTypes.find(
      (s) => s.countAs === AttendanceLogicalStatus.PRESENT
    );
    const absentStatus = defaultAttendanceStatusTypes.find(
      (s) => s.countAs === AttendanceLogicalStatus.ABSENT
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

    expect(component.loadingDone).toBeTrue();
    expect(component.tableDataSource.data).toEqual([
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

  it("should correctly use the offset", () => {
    // default case: last week monday till saturday
    const mondayLastWeek = moment().startOf("isoWeek").subtract(7, "days");
    const saturdayLastWeek = mondayLastWeek.clone().add("5", "days");
    mockAttendanceService.getAllActivityAttendancesForPeriod.calls.reset();

    component.ngOnInit();

    expect(
      mockAttendanceService.getAllActivityAttendancesForPeriod
    ).toHaveBeenCalledWith(mondayLastWeek.toDate(), saturdayLastWeek.toDate());

    // with offset: this week monday till saturday
    const mondayThisWeek = moment().startOf("isoWeek");
    const saturdayThisWeek = mondayThisWeek.clone().add(5, "days");
    mockAttendanceService.getAllActivityAttendancesForPeriod.calls.reset();

    component.daysOffset = 7;
    component.ngOnInit();

    expect(
      mockAttendanceService.getAllActivityAttendancesForPeriod
    ).toHaveBeenCalledWith(mondayThisWeek.toDate(), saturdayThisWeek.toDate());
  });
});
