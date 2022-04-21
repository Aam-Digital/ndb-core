import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { AttendanceModule } from "../../attendance.module";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("AttendanceWeekDashboardComponent", () => {
  let component: AttendanceWeekDashboardComponent;
  let fixture: ComponentFixture<AttendanceWeekDashboardComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AttendanceModule, MockedTestingModule.withState()],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceWeekDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
