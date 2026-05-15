import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceBlockComponent } from "./attendance-block.component";
import { ActivityAttendance } from "../../model/activity-attendance";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("AttendanceBlockComponent", () => {
  let component: AttendanceBlockComponent;
  let fixture: ComponentFixture<AttendanceBlockComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AttendanceBlockComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceBlockComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      "attendanceData",
      ActivityAttendance.create(new Date()),
    );
    fixture.componentRef.setInput("forChild", "test-child");

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
