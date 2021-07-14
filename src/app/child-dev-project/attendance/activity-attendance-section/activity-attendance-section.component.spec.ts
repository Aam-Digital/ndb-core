import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ActivityAttendanceSectionComponent } from "./activity-attendance-section.component";
import { AttendanceService } from "../attendance.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { DatePipe, PercentPipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RecurringActivity } from "../model/recurring-activity";
import { ActivityAttendance } from "../model/activity-attendance";
import { EventNote } from "../model/event-note";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceModule } from "../attendance.module";
import { MatNativeDateModule } from "@angular/material/core";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";

describe("ActivityAttendanceSectionComponent", () => {
  let component: ActivityAttendanceSectionComponent;
  let fixture: ComponentFixture<ActivityAttendanceSectionComponent>;

  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;
  let testActivity: RecurringActivity;
  let testRecords: ActivityAttendance[];

  beforeEach(
    waitForAsync(() => {
      testActivity = RecurringActivity.create("test act");
      testRecords = [ActivityAttendance.create(new Date(), [])];

      mockAttendanceService = jasmine.createSpyObj("mockAttendanceService", [
        "getActivityAttendances",
      ]);
      mockAttendanceService.getActivityAttendances.and.resolveTo(testRecords);

      TestBed.configureTestingModule({
        imports: [AttendanceModule, NoopAnimationsModule, MatNativeDateModule],
        providers: [
          { provide: AttendanceService, useValue: mockAttendanceService },
          {
            provide: EntityMapperService,
            useValue: mockEntityMapper(),
          },
          DatePipe,
          PercentPipe,
          {
            provide: SessionService,
            useValue: { getCurrentUser: () => new User() },
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityAttendanceSectionComponent);
    component = fixture.componentInstance;

    component.activity = testActivity;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should init recent records by default", async () => {
    await component.init();

    expect(mockAttendanceService.getActivityAttendances).toHaveBeenCalledWith(
      testActivity,
      jasmine.any(Date)
    );
    expect(component.allRecords).toEqual(testRecords);
  });

  it("should init all records", async () => {
    await component.init(true);

    expect(mockAttendanceService.getActivityAttendances).toHaveBeenCalledWith(
      testActivity
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
        (s) => s.countAs === AttendanceLogicalStatus.PRESENT
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
});
