import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";

import { RollCallSetupComponent } from "./roll-call-setup.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { AttendanceService } from "../../attendance.service";
import { EventNote } from "../../model/event-note";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TEST_USER } from "#src/app/core/user/demo-user-generator.service";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { Router } from "@angular/router";

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
    expect(component.existingEvents[0].authors).toEqual([
      `${TestEntity.ENTITY_TYPE}:${TEST_USER}`,
    ]);
    expect(component.existingEvents[1].authors).toEqual([
      `${TestEntity.ENTITY_TYPE}:${TEST_USER}`,
    ]);
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

  it("should navigate to roll call with event ID for existing events", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    (component as any).dateField = { valid: true };
    const event = Note.create(new Date()) as Note & {
      isNewFromActivity?: boolean;
    };
    Object.defineProperty(event, "_id", { value: "EventNote:test-123" });

    component.selectEvent(event);

    expect(router.navigate).toHaveBeenCalledWith([
      "/attendance/add-day",
      "EventNote:test-123",
    ]);
  });

  it("should navigate to new roll call with activity query params for new-from-activity events", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    (component as any).dateField = { valid: true };
    const event = Note.create(new Date()) as Note & {
      isNewFromActivity?: boolean;
    };
    event.relatesTo = "RecurringActivity:activity-1";
    event.date = new Date(2025, 5, 15);
    event.isNewFromActivity = true;

    component.selectEvent(event);

    expect(router.navigate).toHaveBeenCalledWith(
      ["/attendance/add-day", "new"],
      {
        queryParams: {
          activity: "RecurringActivity:activity-1",
          date: "2025-06-15",
        },
      },
    );
  });
});
