import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { signal } from "@angular/core";

import { RollCallSetupComponent } from "./roll-call-setup.component";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { AttendanceService } from "../../attendance.service";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { Router } from "@angular/router";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { EventWithAttendance } from "../../model/event-with-attendance";

function wrapEvent(entity: TestEventEntity): EventWithAttendance {
  return new EventWithAttendance(
    entity,
    "attendance",
    "date",
    "relatesTo",
    "authors",
    undefined,
  );
}

describe("RollCallSetupComponent", () => {
  let component: RollCallSetupComponent;
  let fixture: ComponentFixture<RollCallSetupComponent>;

  let mockChildrenService: any;
  let mockAttendanceService: any;

  async function stabilize() {
    for (let i = 0; i < 5; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      await Promise.resolve();
    }
  }

  beforeEach(waitForAsync(() => {
    mockChildrenService = {
      queryActiveRelationsOf: vi.fn(),
    };
    mockChildrenService.queryActiveRelationsOf.mockResolvedValue([]);
    mockAttendanceService = {
      getAvailableEventsForRollCall: vi
        .fn()
        .mockName("AttendanceService.getAvailableEventsForRollCall"),
      eventTypes: vi.fn().mockReturnValue([]),
      eventTypeSettings: [],
      filterConfig: signal([]),
    };
    mockAttendanceService.getAvailableEventsForRollCall.mockResolvedValue({
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
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(RollCallSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows events returned by the service", async () => {
    const event1 = wrapEvent(TestEventEntity.create());
    const event2 = wrapEvent(TestEventEntity.create());
    mockAttendanceService.getAvailableEventsForRollCall.mockResolvedValue({
      events: [event1, event2],
      allEvents: [event1, event2],
    });

    (component as any).eventsResource.reload();
    await stabilize();

    expect(component.filteredEvents()).toEqual([event1, event2]);
    expect(component.activeEvents()).toEqual([event1, event2]);
  });

  it("showingAll is true when there are no events", async () => {
    const event = wrapEvent(TestEventEntity.create());
    mockAttendanceService.getAvailableEventsForRollCall.mockResolvedValue({
      events: [],
      allEvents: [event],
    });

    (component as any).eventsResource.reload();
    await stabilize();

    expect(component.showingAll()).toBe(true);
  });

  it("showMore() switches to allEvents without re-fetching", async () => {
    const userEvent = wrapEvent(TestEventEntity.create());
    const otherEvent = wrapEvent(TestEventEntity.create());
    mockAttendanceService.getAvailableEventsForRollCall.mockResolvedValue({
      events: [userEvent],
      allEvents: [userEvent, otherEvent],
    });
    (component as any).eventsResource.reload();
    await stabilize();
    mockAttendanceService.getAvailableEventsForRollCall.mockClear();

    component.showMore();

    expect(component.showingAll()).toBe(true);
    expect(component.filteredEvents()).toEqual([userEvent, otherEvent]);
    expect(
      mockAttendanceService.getAvailableEventsForRollCall,
    ).not.toHaveBeenCalled();
  });

  it("showLess() switches back to user events without re-fetching", async () => {
    const userEvent = wrapEvent(TestEventEntity.create());
    const otherEvent = wrapEvent(TestEventEntity.create());
    mockAttendanceService.getAvailableEventsForRollCall.mockResolvedValue({
      events: [userEvent],
      allEvents: [userEvent, otherEvent],
    });
    (component as any).eventsResource.reload();
    await stabilize();
    component.showMore();
    mockAttendanceService.getAvailableEventsForRollCall.mockClear();

    component.showLess();

    expect(component.showingAll()).toBe(false);
    expect(component.filteredEvents()).toEqual([userEvent]);
    expect(
      mockAttendanceService.getAvailableEventsForRollCall,
    ).not.toHaveBeenCalled();
  });

  it("should navigate to roll call with event ID for existing events", () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, "navigate");
    (component as any).dateField = { valid: true };

    const entity = TestEventEntity.create();
    Object.defineProperty(entity, "_id", { value: "TestEventEntity:test-123" });
    const event = wrapEvent(entity);

    component.selectEvent(event);

    expect(router.navigate).toHaveBeenCalledWith([
      "/attendance/add-day",
      "TestEventEntity:test-123",
    ]);
  });

  it("should navigate to new roll call with activity query params for new-from-activity events", () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, "navigate");
    (component as any).dateField = { valid: true };

    const entity = TestEventEntity.create();
    entity.relatesTo = "RecurringActivity:activity-1";
    entity.date = new Date(2025, 5, 15);
    const event = wrapEvent(entity);

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

  it("derives entityType from the first loaded event", async () => {
    const event = wrapEvent(TestEventEntity.create());
    mockAttendanceService.getAvailableEventsForRollCall.mockResolvedValue({
      events: [event],
      allEvents: [event],
    });

    (component as any).eventsResource.reload();
    await stabilize();

    expect(component.entityType()).toBe(TestEventEntity);
  });

  it("returns undefined entityType when no events are loaded", () => {
    expect(component.entityType()).toBeUndefined();
  });
});
