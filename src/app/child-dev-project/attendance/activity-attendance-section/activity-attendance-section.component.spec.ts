import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ActivityAttendanceSectionComponent } from "./activity-attendance-section.component";
import { AttendanceService } from "../attendance.service";
import { DatePipe, PercentPipe } from "@angular/common";
import { RecurringActivity } from "../model/recurring-activity";
import { ActivityAttendance } from "../model/activity-attendance";
import { EventNote } from "../model/event-note";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import moment from "moment";

describe("ActivityAttendanceSectionComponent", () => {
  let component: ActivityAttendanceSectionComponent;
  let fixture: ComponentFixture<ActivityAttendanceSectionComponent>;

  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;
  let testActivity: RecurringActivity;
  let testRecords: ActivityAttendance[];

  beforeEach(waitForAsync(() => {
    testActivity = RecurringActivity.create("test act");
    testRecords = [ActivityAttendance.create(new Date(), [])];

    mockAttendanceService = jasmine.createSpyObj("mockAttendanceService", [
      "getActivityAttendances",
    ]);
    mockAttendanceService.getActivityAttendances.and.resolveTo(testRecords);
    TestBed.configureTestingModule({
      imports: [
        ActivityAttendanceSectionComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
        DatePipe,
        PercentPipe,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityAttendanceSectionComponent);
    component = fixture.componentInstance;

    component.entity = testActivity;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should init recent records by default", async () => {
    await component.init();

    expect(mockAttendanceService.getActivityAttendances).toHaveBeenCalledWith(
      testActivity,
      jasmine.any(Date),
    );
    expect(component.allRecords).toEqual(testRecords);
  });

  it("should init all records", async () => {
    await component.init(true);

    expect(mockAttendanceService.getActivityAttendances).toHaveBeenCalledWith(
      testActivity,
    );
    expect(component.allRecords).toEqual(testRecords);
  });

  it("should also display records without participation if toggled", () => {
    const testChildId = "testChild";
    component.forChild = testChildId;

    const eventParticipatingIn = EventNote.create(new Date(), "participating");
    eventParticipatingIn.addChild(testChildId);
    eventParticipatingIn.getAttendance(testChildId).status =
      defaultAttendanceStatusTypes.find(
        (s) => s.countAs === AttendanceLogicalStatus.PRESENT,
      );

    component.allRecords = [
      ActivityAttendance.create(new Date(), []),
      ActivityAttendance.create(new Date(), [
        EventNote.create(new Date(), "empty test"),
      ]),
      ActivityAttendance.create(new Date(), [eventParticipatingIn]),
    ];

    component.updateDisplayedRecords(false);
    expect(component.records).toEqual([component.allRecords[2]]);

    component.updateDisplayedRecords(true);
    expect(component.records).toEqual(component.allRecords);
  });

  it("should combine all activity attendances to have an all-time overview", async () => {
    const oldestEvent = EventNote.create(
      moment().subtract(2, "months").toDate(),
    );
    const someEvent1 = EventNote.create(
      moment().subtract(1, "months").toDate(),
    );
    const someEvent2 = EventNote.create(
      moment().subtract(1, "months").toDate(),
    );
    const latestEvent = EventNote.create(new Date());
    const oldestAttendance = ActivityAttendance.create(oldestEvent.date, [
      oldestEvent,
    ]);
    oldestAttendance.periodTo = oldestEvent.date;
    const middleAttendance = ActivityAttendance.create(someEvent1.date, [
      someEvent1,
      someEvent2,
    ]);
    middleAttendance.periodTo = someEvent2.date;
    const latestAttendance = ActivityAttendance.create(latestEvent.date, [
      latestEvent,
    ]);
    latestAttendance.periodTo = latestEvent.date;
    mockAttendanceService.getActivityAttendances.and.resolveTo([
      oldestAttendance,
      middleAttendance,
      latestAttendance,
    ]);

    await component.init();

    expect(component.combinedAttendance.periodFrom).toBe(oldestEvent.date);
    expect(component.combinedAttendance.periodTo).toBe(latestEvent.date);
    expect(component.combinedAttendance.events).toEqual(
      jasmine.arrayWithExactContents([
        oldestEvent,
        someEvent1,
        someEvent2,
        latestEvent,
      ]),
    );
  });
});
