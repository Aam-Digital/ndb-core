import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { GroupedChildAttendanceComponent } from "./grouped-child-attendance.component";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { AttendanceService } from "../../attendance.service";
import { expectEntitiesToMatch } from "#src/app/utils/expect-entity-data.spec";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("GroupedChildAttendanceComponent", () => {
  let component: GroupedChildAttendanceComponent;
  let fixture: ComponentFixture<GroupedChildAttendanceComponent>;
  let mockAttendanceService: any;

  beforeEach(waitForAsync(() => {
    mockAttendanceService = {
      getActivitiesForParticipant: vi.fn(),
      eventTypes: vi.fn().mockReturnValue([]),
    };
    mockAttendanceService.getActivitiesForParticipant.mockResolvedValue([]);

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
    const activity = TestEntity.create("test activity");
    mockAttendanceService.getActivitiesForParticipant.mockResolvedValue([
      activity,
    ]);

    await component.ngOnInit();

    expectEntitiesToMatch(component.activities, [activity]);
  });

  it("should separate active and archived activities", async () => {
    const activeActivity = TestEntity.create("active");
    activeActivity.isActive = true;
    const archivedActivity = TestEntity.create("archived");
    archivedActivity.isActive = false;
    mockAttendanceService.getActivitiesForParticipant.mockResolvedValue([
      activeActivity,
      archivedActivity,
    ]);

    await component.ngOnInit();

    expectEntitiesToMatch(component.activities, [activeActivity]);
    expectEntitiesToMatch(component.archivedActivities, [archivedActivity]);
  });
});
