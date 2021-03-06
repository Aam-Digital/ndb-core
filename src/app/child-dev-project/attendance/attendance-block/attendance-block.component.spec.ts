import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceBlockComponent } from "./attendance-block.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivityAttendance } from "../model/activity-attendance";
import { AttendanceModule } from "../attendance.module";

describe("AttendanceBlockComponent", () => {
  let component: AttendanceBlockComponent;
  let fixture: ComponentFixture<AttendanceBlockComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AttendanceModule, RouterTestingModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceBlockComponent);
    component = fixture.componentInstance;

    component.attendanceData = ActivityAttendance.create(new Date());

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
