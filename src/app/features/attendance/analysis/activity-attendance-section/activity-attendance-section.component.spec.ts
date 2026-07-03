import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ActivityAttendanceSectionComponent } from "./activity-attendance-section.component";
import { AttendanceService } from "../../attendance.service";
import { DatePipe, PercentPipe } from "@angular/common";
import { ActivityAttendance } from "../../model/activity-attendance";
import { Entity } from "#src/app/core/entity/model/entity";
import { EventWithAttendance } from "../../model/event-with-attendance";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import moment from "moment";
import { expectArrayWithExactContents } from "#src/app/utils/test-utils/array-test-utils";

describe("ActivityAttendanceSectionComponent", () => {
  let component: ActivityAttendanceSectionComponent;
  let fixture: ComponentFixture<ActivityAttendanceSectionComponent>;

  let mockAttendanceService: any;
  let testActivity: Entity;
  let testRecords: ActivityAttendance[];

  beforeEach(waitForAsync(() => {
    testActivity = TestEntity.create("test act");
    testRecords = [ActivityAttendance.create(new Date(), [])];

    mockAttendanceService = {
      getActivityAttendances: vi
        .fn()
        .mockName("mockAttendanceService.getActivityAttendances"),
      wrapEventEntity: vi
        .fn()
        .mockName("mockAttendanceService.wrapEventEntity"),
      getLatestEventDate: vi
        .fn()
        .mockName("mockAttendanceService.getLatestEventDate"),
      eventTypes: vi.fn().mockReturnValue([]),
    };
    mockAttendanceService.getActivityAttendances.mockResolvedValue(testRecords);
    mockAttendanceService.getLatestEventDate.mockResolvedValue(undefined);
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

    fixture.componentRef.setInput("entity", testActivity);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should init recent records by default", async () => {
    await fixture.whenStable();

    expect(mockAttendanceService.getActivityAttendances).toHaveBeenCalledWith(
      testActivity,
      expect.any(Date),
    );
    expect(component.records()).toEqual(testRecords);
  });

  it("should init all records", async () => {
    component.loadAll.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockAttendanceService.getActivityAttendances).toHaveBeenCalledWith(
      testActivity,
    );
    expect(component.records()).toEqual(testRecords);
  });

  it("should fall back to loading the most recent month if no records in default range", async () => {
    const latestEventDate = moment()
      .subtract(2, "years")
      .startOf("month")
      .add(10, "days")
      .toDate();
    const oldRecords = [ActivityAttendance.create(latestEventDate, [])];
    mockAttendanceService.getActivityAttendances.mockImplementation(
      async (_entity, from?: Date) =>
        from && moment(from).isAfter(latestEventDate) ? [] : oldRecords,
    );
    mockAttendanceService.getLatestEventDate.mockResolvedValue(latestEventDate);

    component.attendanceData.reload();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.records()).toEqual(oldRecords);
    expect(component.fallbackToOlder()).toBe(true);
    expect(mockAttendanceService.getActivityAttendances).toHaveBeenCalledWith(
      testActivity,
      moment(latestEventDate).startOf("month").toDate(),
    );
  });

  it("should not fall back if activity has no events at all", async () => {
    mockAttendanceService.getActivityAttendances.mockResolvedValue([]);
    mockAttendanceService.getLatestEventDate.mockResolvedValue(undefined);

    component.attendanceData.reload();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.records()).toEqual([]);
    expect(component.fallbackToOlder()).toBe(false);
  });

  it("should also display records without participation if toggled", async () => {
    const testChildId = "testChild";
    fixture.componentRef.setInput("forChild", testChildId);

    const eventParticipatingIn = TestEventEntity.generateEventWithAttendance([
      [testChildId, AttendanceLogicalStatus.PRESENT],
    ]);
    const allRecords = [
      ActivityAttendance.create(new Date(), []),
      ActivityAttendance.create(new Date(), [
        TestEventEntity.generateEventWithAttendance([]),
      ]),
      ActivityAttendance.create(new Date(), [eventParticipatingIn]),
    ];

    mockAttendanceService.getActivityAttendances.mockResolvedValue(allRecords);
    component.attendanceData.reload();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.records()).toEqual([allRecords[2]]);

    component.includeWithoutParticipation.set(true);
    expect(component.records()).toHaveLength(3);
  });

  it("should combine all activity attendances to have an all-time overview", async () => {
    const oldestEvent = TestEventEntity.create(
      moment().subtract(2, "months").toDate(),
    );
    const someEvent1 = TestEventEntity.create(
      moment().subtract(1, "months").toDate(),
    );
    const someEvent2 = TestEventEntity.create(
      moment().subtract(1, "months").toDate(),
    );
    const latestEvent = TestEventEntity.create(new Date());
    const wrap = (e: TestEventEntity) =>
      new EventWithAttendance(
        e,
        "attendance",
        "date",
        "relatesTo",
        "authors",
        undefined,
      );
    const oldestAttendance = ActivityAttendance.create(oldestEvent.date, [
      wrap(oldestEvent),
    ]);
    oldestAttendance.periodTo = oldestEvent.date;
    const middleAttendance = ActivityAttendance.create(someEvent1.date, [
      wrap(someEvent1),
      wrap(someEvent2),
    ]);
    middleAttendance.periodTo = someEvent2.date;
    const latestAttendance = ActivityAttendance.create(latestEvent.date, [
      wrap(latestEvent),
    ]);
    latestAttendance.periodTo = latestEvent.date;
    mockAttendanceService.getActivityAttendances.mockResolvedValue([
      oldestAttendance,
      middleAttendance,
      latestAttendance,
    ]);
    component.attendanceData.reload();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.combinedAttendance().periodFrom).toBe(oldestEvent.date);
    expect(component.combinedAttendance().periodTo).toBe(latestEvent.date);
    expectArrayWithExactContents(
      component.combinedAttendance().events.map((e) => e.entity),
      [oldestEvent, someEvent1, someEvent2, latestEvent],
    );
  });
});
