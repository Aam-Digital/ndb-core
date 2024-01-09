import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";

import { RollCallSetupComponent } from "./roll-call-setup.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { ChildrenService } from "../../../children/children.service";
import { AttendanceService } from "../../attendance.service";
import { EventNote } from "../../model/event-note";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TEST_USER } from "../../../../core/user/demo-user-generator.service";

describe("RollCallSetupComponent", () => {
  let component: RollCallSetupComponent;
  let fixture: ComponentFixture<RollCallSetupComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj(["queryActiveRelationsOf"]);
    mockChildrenService.queryActiveRelationsOf.and.resolveTo([]);
    mockAttendanceService = jasmine.createSpyObj([
      "getEventsWithUpdatedParticipants",
      "createEventForActivity",
    ]);
    mockAttendanceService.getEventsWithUpdatedParticipants.and.resolveTo([]);
    mockAttendanceService.createEventForActivity.and.resolveTo(new EventNote());

    TestBed.configureTestingModule({
      imports: [RollCallSetupComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RollCallSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("generates event notes with current user as author", fakeAsync(() => {
    const testActivities = [
      RecurringActivity.create("act 1"),
      RecurringActivity.create("act 2"),
    ];
    mockAttendanceService.createEventForActivity.and.resolveTo(new EventNote());
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "loadType").and.resolveTo(testActivities);

    component.ngOnInit();
    flush();

    expect(component.existingEvents.length).toBe(2);
    expect(component.existingEvents[0].authors).toEqual([TEST_USER]);
    expect(component.existingEvents[1].authors).toEqual([TEST_USER]);
  }));

  it("should only show active activities", fakeAsync(() => {
    const active = new RecurringActivity();
    const inactive = new RecurringActivity();
    inactive["active"] = false;
    mockAttendanceService.createEventForActivity.and.resolveTo(new EventNote());
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "loadType").and.resolveTo([active, inactive]);

    component.ngOnInit();
    flush();

    expect(component.existingEvents).toHaveSize(1);
  }));

  it("should show all activities if none are assigned to the current user or unassigned", fakeAsync(() => {
    const activity = new RecurringActivity();
    activity.assignedTo = ["otherUser"];
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "loadType").and.resolveTo([activity]);

    component.ngOnInit();
    flush();

    expect(component.filteredExistingEvents).toHaveSize(1);
    expect(component.showingAll).toBeTrue();
  }));
});
