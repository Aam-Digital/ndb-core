import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceService } from "../attendance.service";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import moment from "moment";
import * as MockDate from "mockdate";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { EventWithAttendance } from "../model/event-with-attendance";

describe("AttendanceWeekDashboardComponent", () => {
  let component: AttendanceWeekDashboardComponent;
  let fixture: ComponentFixture<AttendanceWeekDashboardComponent>;
  let mockAttendanceService: any;

  beforeEach(waitForAsync(() => {
    mockAttendanceService = {
      getEventsOnDate: vi.fn(),
      wrapEventEntity: vi.fn(),
      eventTypes: vi.fn().mockReturnValue([]),
    };
    mockAttendanceService.getEventsOnDate.mockResolvedValue([]);
    mockAttendanceService.wrapEventEntity.mockImplementation(
      (e) =>
        new EventWithAttendance(
          e,
          "attendance",
          "date",
          "relatesTo",
          "authors",
          undefined,
        ),
    );
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
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display children with low attendance", async () => {
    const absentChild = new TestEntity();
    const presentChild = new TestEntity();
    const activity = new TestEntity();
    const mondayLastWeek = moment().startOf("isoWeek").subtract(7, "days");

    const e1 = TestEventEntity.generateEventWithAttendance(
      [
        [absentChild.getId(), AttendanceLogicalStatus.ABSENT],
        [presentChild.getId(), AttendanceLogicalStatus.PRESENT],
      ],
      mondayLastWeek.toDate(),
      activity,
    );
    const e2 = TestEventEntity.generateEventWithAttendance(
      [
        [absentChild.getId(), AttendanceLogicalStatus.ABSENT],
        [presentChild.getId(), AttendanceLogicalStatus.PRESENT],
      ],
      moment(mondayLastWeek).add(1, "day").toDate(),
      activity,
    );

    mockAttendanceService.getEventsOnDate.mockResolvedValue([
      e1.entity,
      e2.entity,
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.entries()).toHaveLength(1);
    expect(component.entries()[0][0].participantId).toBe(absentChild.getId());
  });

  it("should not display children with sufficient attendance", async () => {
    const presentChild = new TestEntity();
    const activity = new TestEntity();
    const mondayLastWeek = moment().startOf("isoWeek").subtract(7, "days");

    const e1 = TestEventEntity.generateEventWithAttendance(
      [[presentChild.getId(), AttendanceLogicalStatus.PRESENT]],
      mondayLastWeek.toDate(),
      activity,
    );

    mockAttendanceService.getEventsOnDate.mockResolvedValue([e1.entity]);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.entries()).toHaveLength(0);
  });

  it("should treat events without an activity as one group", async () => {
    const absentChild = new TestEntity();
    const mondayLastWeek = moment().startOf("isoWeek").subtract(7, "days");

    // Two standalone events with no relatesTo — no activity link
    const e1 = TestEventEntity.generateEventWithAttendance(
      [[absentChild.getId(), AttendanceLogicalStatus.ABSENT]],
      mondayLastWeek.toDate(),
    );
    const e2 = TestEventEntity.generateEventWithAttendance(
      [[absentChild.getId(), AttendanceLogicalStatus.ABSENT]],
      moment(mondayLastWeek).add(1, "day").toDate(),
    );

    mockAttendanceService.getEventsOnDate.mockResolvedValue([
      e1.entity,
      e2.entity,
    ]);

    fixture.detectChanges();
    await fixture.whenStable();

    // Both events are grouped together (both under undefined key), so absentChild
    // accumulates 2 absences and crosses the threshold → 1 entry group
    expect(component.entries()).toHaveLength(1);
    expect(component.entries()[0][0].participantId).toBe(absentChild.getId());
    expect(
      component.entries()[0][0].attendanceDays.filter(Boolean),
    ).toHaveLength(2);
  });

  it("should correctly use the offset", async () => {
    MockDate.set(moment("2023-11-20").toDate());

    fixture.destroy();
    fixture = TestBed.createComponent(AttendanceWeekDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockAttendanceService.getEventsOnDate).toHaveBeenCalledWith(
      moment("2023-11-13").toDate(),
      moment("2023-11-18").toDate(),
    );

    fixture.componentRef.setInput("daysOffset", 7);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockAttendanceService.getEventsOnDate).toHaveBeenLastCalledWith(
      moment("2023-11-20").toDate(),
      moment("2023-11-25").toDate(),
    );

    MockDate.reset();
  });
});
