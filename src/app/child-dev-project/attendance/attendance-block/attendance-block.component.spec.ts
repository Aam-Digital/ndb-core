import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceBlockComponent } from "./attendance-block.component";
import { ActivityAttendance } from "../model/activity-attendance";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("AttendanceBlockComponent", () => {
  let component: AttendanceBlockComponent;
  let fixture: ComponentFixture<AttendanceBlockComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AttendanceBlockComponent, MockedTestingModule.withState()],
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
