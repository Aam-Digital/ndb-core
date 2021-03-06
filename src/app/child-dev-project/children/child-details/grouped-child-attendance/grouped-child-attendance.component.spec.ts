import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { GroupedChildAttendanceComponent } from "./grouped-child-attendance.component";
import { AttendanceService } from "../../../attendance/attendance.service";

describe("GroupedChildAttendanceComponent", () => {
  let component: GroupedChildAttendanceComponent;
  let fixture: ComponentFixture<GroupedChildAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GroupedChildAttendanceComponent],
      providers: [
        {
          provide: AttendanceService,
          useValue: { getActivityAttendances: () => Promise.resolve([]) },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupedChildAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
