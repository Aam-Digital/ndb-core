import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildPhotoService } from "../../../children/child-photo-service/child-photo.service";
import { AttendanceModule } from "../../attendance.module";
import { AttendanceService } from "../../attendance.service";

describe("AttendanceWeekDashboardComponent", () => {
  let component: AttendanceWeekDashboardComponent;
  let fixture: ComponentFixture<AttendanceWeekDashboardComponent>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(
    waitForAsync(() => {
      mockAttendanceService = jasmine.createSpyObj([
        "getAllActivityAttendancesForPeriod",
      ]);
      mockAttendanceService.getAllActivityAttendancesForPeriod.and.resolveTo(
        []
      );
      TestBed.configureTestingModule({
        imports: [AttendanceModule, RouterTestingModule.withRoutes([])],
        providers: [
          {
            provide: ChildPhotoService,
            useValue: jasmine.createSpyObj(["getImage"]),
          },
          { provide: AttendanceService, useValue: mockAttendanceService },
        ],
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
