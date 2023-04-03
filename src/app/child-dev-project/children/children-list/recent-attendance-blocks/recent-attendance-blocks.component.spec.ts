import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { RecentAttendanceBlocksComponent } from "./recent-attendance-blocks.component";
import { Child } from "../../model/child";
import { AttendanceService } from "../../../attendance/attendance.service";
import { ActivityAttendance } from "../../../attendance/model/activity-attendance";
import { RecurringActivity } from "../../../attendance/model/recurring-activity";
import { defaultInteractionTypes } from "../../../../core/config/default-config/default-interaction-types";
import { WINDOW_TOKEN } from "../../../../utils/di-tokens";

describe("RecentAttendanceBlocksComponent", () => {
  let component: RecentAttendanceBlocksComponent;
  let fixture: ComponentFixture<RecentAttendanceBlocksComponent>;

  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(waitForAsync(() => {
    mockAttendanceService = jasmine.createSpyObj("mockAttendanceService", [
      "getActivitiesForChild",
      "getAllActivityAttendancesForPeriod",
    ]);

    TestBed.configureTestingModule({
      imports: [RecentAttendanceBlocksComponent],
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: WINDOW_TOKEN, useValue: window },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentAttendanceBlocksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display blocks for all activities of the filtered activity type", async () => {
    const testChild = new Child("testID");
    const testActivity1 = RecurringActivity.create("test 1");
    testActivity1.type = defaultInteractionTypes[1];
    const testActivity2 = RecurringActivity.create("test 2");
    testActivity2.type = defaultInteractionTypes[1];
    const testActivity3 = RecurringActivity.create("test 3");
    testActivity3.type = defaultInteractionTypes[2];

    mockAttendanceService.getActivitiesForChild.and.resolveTo([
      testActivity1,
      testActivity2,
      testActivity3,
    ]);
    mockAttendanceService.getAllActivityAttendancesForPeriod.and.callFake(
      (from, to) => {
        const results = [];
        for (const activity of [testActivity1, testActivity2, testActivity3]) {
          const record = ActivityAttendance.create(from, []);
          record.periodTo = to;
          record.activity = activity;
          results.push(record);
        }
        return Promise.resolve(results);
      }
    );

    component.entity = testChild;
    component.config = {
      filterByActivityType: defaultInteractionTypes[1].id,
    };
    await component.ngOnInit();

    expect(component.attendanceList).toHaveSize(2);
  });
});
