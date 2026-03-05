import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";

import { RollCallSetupComponent } from "./roll-call-setup.component";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { AttendanceService } from "../../attendance.service";
import { EventNote } from "../../model/event-note";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { Router } from "@angular/router";

describe("RollCallSetupComponent", () => {
  let component: RollCallSetupComponent;
  let fixture: ComponentFixture<RollCallSetupComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;

  const emptyResult = () =>
    Promise.resolve({
      events: [],
      allEvents: [],
    });

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj(["queryActiveRelationsOf"]);
    mockChildrenService.queryActiveRelationsOf.and.resolveTo([]);
    mockAttendanceService = jasmine.createSpyObj([
      "getAvailableEventsForRollCall",
    ]);
    mockAttendanceService.getAvailableEventsForRollCall.and.callFake(
      emptyResult,
    );

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

  it("shows events returned by the service", fakeAsync(() => {
    const event1 = new EventNote();
    const event2 = new EventNote();
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [event1, event2],
      allEvents: [event1, event2],
    });

    component.ngOnInit();
    flush();

    expect(component.filteredEvents).toEqual([event1, event2]);
    expect(component.activeEvents).toEqual([event1, event2]);
  }));

  it("showingAll is true when user events equal all events", fakeAsync(() => {
    const event = new EventNote();
    const events = [event];
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events,
      allEvents: events,
    });

    component.ngOnInit();
    flush();

    expect(component.showingAll).toBeTrue();
  }));

  it("showMore() switches to allEvents without re-fetching", fakeAsync(() => {
    const userEvent = new EventNote();
    const otherEvent = new EventNote();
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [userEvent],
      allEvents: [userEvent, otherEvent],
    });
    component.ngOnInit();
    flush();
    mockAttendanceService.getAvailableEventsForRollCall.calls.reset();

    component.showMore();

    expect(component.showingAll).toBeTrue();
    expect(component.filteredEvents).toEqual([userEvent, otherEvent]);
    expect(
      mockAttendanceService.getAvailableEventsForRollCall,
    ).not.toHaveBeenCalled();
  }));

  it("showLess() switches back to user events without re-fetching", fakeAsync(() => {
    const userEvent = new EventNote();
    const otherEvent = new EventNote();
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [userEvent],
      allEvents: [userEvent, otherEvent],
    });
    component.ngOnInit();
    flush();
    component.showMore();
    mockAttendanceService.getAvailableEventsForRollCall.calls.reset();

    component.showLess();

    expect(component.showingAll).toBeFalse();
    expect(component.filteredEvents).toEqual([userEvent]);
    expect(
      mockAttendanceService.getAvailableEventsForRollCall,
    ).not.toHaveBeenCalled();
  }));

  it("should navigate to roll call with event ID for existing events", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    (component as any).dateField = { valid: true };

    const event = new EventNote();
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

    const event = new EventNote();
    event.relatesTo = "RecurringActivity:activity-1";
    event.date = new Date(2025, 5, 15);

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
    const event = new EventNote();
    mockAttendanceService.getAvailableEventsForRollCall.and.resolveTo({
      events: [event],
      allEvents: [event],
    });

    component.ngOnInit();
    flush();

    expect(component.entityType).toBe(EventNote);
  }));

  it("returns undefined entityType when no events are loaded", () => {
    expect(component.entityType).toBeUndefined();
  });
});
