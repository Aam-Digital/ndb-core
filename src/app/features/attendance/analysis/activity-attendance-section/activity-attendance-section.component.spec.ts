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
    };
    mockAttendanceService.getActivityAttendances.mockResolvedValue(testRecords);
    (mockAttendanceService as any).eventTypes = vi.fn().mockReturnValue([]);
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
      expect.any(Date),
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

    const eventParticipatingIn = TestEventEntity.generateEventWithAttendance([
      [testChildId, AttendanceLogicalStatus.PRESENT],
    ]);

    component.allRecords = [
      ActivityAttendance.create(new Date(), []),
      ActivityAttendance.create(new Date(), [
        TestEventEntity.generateEventWithAttendance([]),
      ]),
      ActivityAttendance.create(new Date(), [eventParticipatingIn]),
    ];

    component.updateDisplayedRecords(false);
    expect(component.records).toEqual([component.allRecords[2]]);

    component.updateDisplayedRecords(true);
    expect(component.records).toEqual(component.allRecords);
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

    await component.init();

    expect(component.combinedAttendance.periodFrom).toBe(oldestEvent.date);
    expect(component.combinedAttendance.periodTo).toBe(latestEvent.date);
    // TODO: vitest-migration: Verify this matches strict array content (multiset equality). Vitest's arrayContaining is a subset check.
    expect(
      component.combinedAttendance.events.map((e) => e.entity),
    ).toHaveLength(4);
    expect(component.combinedAttendance.events.map((e) => e.entity)).toEqual(
      expect.arrayContaining([
        oldestEvent,
        someEvent1,
        someEvent2,
        latestEvent,
      ]),
    );
  });
});
