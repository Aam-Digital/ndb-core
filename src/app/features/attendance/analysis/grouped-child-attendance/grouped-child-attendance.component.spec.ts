import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GroupedChildAttendanceComponent } from "./grouped-child-attendance.component";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { AttendanceService } from "../../attendance.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { expectEntitiesToMatch } from "#src/app/utils/expect-entity-data.spec";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("GroupedChildAttendanceComponent", () => {
  let component: GroupedChildAttendanceComponent;
  let fixture: ComponentFixture<GroupedChildAttendanceComponent>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(waitForAsync(() => {
    mockAttendanceService = jasmine.createSpyObj([
      "getActivitiesForParticipant",
    ]);
    mockAttendanceService.getActivitiesForParticipant.and.resolveTo([]);

    TestBed.configureTestingModule({
      imports: [
        GroupedChildAttendanceComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupedChildAttendanceComponent);
    component = fixture.componentInstance;
    component.entity = new TestEntity();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load activities from attendance service", async () => {
    const activity = RecurringActivity.create("test activity");
    mockAttendanceService.getActivitiesForParticipant.and.resolveTo([activity]);

    await component.ngOnInit();

    expectEntitiesToMatch(component.activities, [activity]);
  });

  it("should separate active and archived activities", async () => {
    const activeActivity = RecurringActivity.create("active");
    activeActivity.isActive = true;
    const archivedActivity = RecurringActivity.create("archived");
    archivedActivity.isActive = false;
    mockAttendanceService.getActivitiesForParticipant.and.resolveTo([
      activeActivity,
      archivedActivity,
    ]);

    await component.ngOnInit();

    expectEntitiesToMatch(component.activities, [activeActivity]);
    expectEntitiesToMatch(component.archivedActivities, [archivedActivity]);
  });
});
