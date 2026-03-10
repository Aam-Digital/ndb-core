import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { RollCallSetupComponent } from "./roll-call-setup.component";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { AttendanceService } from "../../attendance.service";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { EventWithAttendance } from "../../model/event-with-attendance";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { Router } from "@angular/router";

describe("RollCallSetupComponent", () => {
  let component: RollCallSetupComponent;
  let fixture: ComponentFixture<RollCallSetupComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  function stabilize() {
    for (let i = 0; i < 5; i++) {
      fixture.detectChanges();
      tick(); // microtasks (Promises from resource loader, etc.)
      TestBed.tick(); // flush Angular effects and change detection
    }
  }

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj(["queryActiveRelationsOf"]);
    mockChildrenService.queryActiveRelationsOf.and.resolveTo([]);
    mockAttendanceService = jasmine.createSpyObj(
      "AttendanceService",
      ["getAvailableEventsForRollCall"],
      {
        featureSettings: {
          activityTypes: [],
          recurringActivityTypes: [],
          eventTypes: [],
          filterConfig: [],
        },
      },
    );
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [],
      allEvents: [],
    });

    TestBed.configureTestingModule({
      imports: [RollCallSetupComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RollCallSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows events returned by the service", fakeAsync(() => {
    const event1 = new EventWithAttendance(
      new TestEventEntity(),
      "attendance",
      "date",
    );
    const event2 = new EventWithAttendance(
      new TestEventEntity(),
      "attendance",
      "date",
    );
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [event1, event2],
      allEvents: [event1, event2],
    });

    (component as any).eventsResource.reload();
    stabilize();

    expect(component.filteredEvents()).toEqual([event1, event2]);
    expect(component.activeEvents()).toEqual([event1, event2]);
  }));

  it("showingAll is true when there are no user events", fakeAsync(() => {
    const event = new EventWithAttendance(
      new TestEventEntity(),
      "attendance",
      "date",
    );
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [],
      allEvents: [event],
    });

    (component as any).eventsResource.reload();
    stabilize();

    expect(component.showingAll()).toBeTrue();
  }));

  it("showMore() switches to allEvents without re-fetching", fakeAsync(() => {
    const userEvent = new EventWithAttendance(
      new TestEventEntity(),
      "attendance",
      "date",
    );
    const otherEvent = new EventWithAttendance(
      new TestEventEntity(),
      "attendance",
      "date",
    );
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [userEvent],
      allEvents: [userEvent, otherEvent],
    });
    (component as any).eventsResource.reload();
    stabilize();
    mockAttendanceService.getAvailableEventsForRollCall.calls.reset();

    component.showMore();

    expect(component.showingAll()).toBeTrue();
    expect(component.filteredEvents()).toEqual([userEvent, otherEvent]);
    expect(
      mockAttendanceService.getAvailableEventsForRollCall,
    ).not.toHaveBeenCalled();
  }));

  it("showLess() switches back to user events without re-fetching", fakeAsync(() => {
    const userEvent = new EventWithAttendance(
      new TestEventEntity(),
      "attendance",
      "date",
    );
    const otherEvent = new EventWithAttendance(
      new TestEventEntity(),
      "attendance",
      "date",
    );
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [userEvent],
      allEvents: [userEvent, otherEvent],
    });
    (component as any).eventsResource.reload();
    stabilize();
    component.showMore();
    mockAttendanceService.getAvailableEventsForRollCall.calls.reset();

    component.showLess();

    expect(component.showingAll()).toBeFalse();
    expect(component.filteredEvents()).toEqual([userEvent]);
    expect(
      mockAttendanceService.getAvailableEventsForRollCall,
    ).not.toHaveBeenCalled();
  }));

  it("should navigate to roll call with event ID for existing events", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    (component as any).dateField = { valid: true };

    const note = new TestEventEntity();
    Object.defineProperty(note, "_id", { value: "TestEventEntity:test-123" });
    const event = new EventWithAttendance(note, "attendance", "date");

    component.selectEvent(event);

    expect(router.navigate).toHaveBeenCalledWith([
      "/attendance/add-day",
      "TestEventEntity:test-123",
    ]);
  });

  it("should navigate to new roll call with activity query params for new-from-activity events", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    (component as any).dateField = { valid: true };

    const note = new TestEventEntity();
    note.relatesTo = "RecurringActivity:activity-1";
    note.date = new Date(2025, 5, 15);
    const event = new EventWithAttendance(note, "attendance", "date");

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

  it("derives entityType from the first loaded event", fakeAsync(() => {
    const note = new TestEventEntity();
    const event = new EventWithAttendance(note, "attendance", "date");
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [event],
      allEvents: [event],
    });

    (component as any).eventsResource.reload();
    stabilize();

    expect(component.entityType()).toBe(TestEventEntity);
  }));

  it("returns undefined entityType when no events are loaded", () => {
    expect(component.entityType()).toBeUndefined();
  });
});
