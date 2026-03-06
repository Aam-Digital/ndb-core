import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceDetailsComponent } from "./attendance-details.component";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../../model/activity-attendance";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { RecurringActivity } from "../../model/recurring-activity";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("AttendanceDetailsComponent", () => {
  let component: AttendanceDetailsComponent;
  let fixture: ComponentFixture<AttendanceDetailsComponent>;

  beforeEach(waitForAsync(() => {
    const entity = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance(
        [
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.PRESENT],
          ["3", AttendanceLogicalStatus.ABSENT],
        ],
        new Date("2020-01-01"),
      ),
      generateEventWithAttendance(
        [
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.ABSENT],
        ],
        new Date("2020-01-02"),
      ),
    ]);
    entity.activity = RecurringActivity.create("Test Activity");

    TestBed.configureTestingModule({
      imports: [AttendanceDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            attendance: new ActivityAttendance(),
            forChild: undefined,
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
