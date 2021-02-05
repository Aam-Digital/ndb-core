import {
  async,
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
} from "@angular/core/testing";

import { RecentAttendanceBlocksComponent } from "./recent-attendance-blocks.component";
import { FilterPipeModule } from "ngx-filter-pipe";
import { Child } from "../../model/child";
import { AttendanceService } from "../../../attendance/attendance.service";
import { ActivityAttendance } from "../../../attendance/model/activity-attendance";
import { RecurringActivity } from "../../../attendance/model/recurring-activity";
import { defaultInteractionTypes } from "../../../../core/config/default-config/default-interaction-types";

describe("RecentAttendanceBlocksComponent", () => {
  let component: RecentAttendanceBlocksComponent;
  let fixture: ComponentFixture<RecentAttendanceBlocksComponent>;

  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(async(() => {
    mockAttendanceService = jasmine.createSpyObj("mockAttendanceService", [
      "getActivitiesForChild",
      "getActivityAttendanceForPeriod",
    ]);

    TestBed.configureTestingModule({
      declarations: [RecentAttendanceBlocksComponent],
      imports: [FilterPipeModule],
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
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

  it("should display blocks for all activities of the filtered activity type", fakeAsync(() => {
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
    mockAttendanceService.getActivityAttendanceForPeriod.and.callFake(
      (activity) => {
        const record = ActivityAttendance.create(new Date(), []);
        record.activity = activity;
        return Promise.resolve(record);
      }
    );

    component.onInitFromDynamicConfig({
      entity: testChild,
      id: "",
      config: {
        filterByActivityType: defaultInteractionTypes[1].id,
      },
    });
    flush();

    expect(component.attendanceList.length).toBe(2);
  }));
});
