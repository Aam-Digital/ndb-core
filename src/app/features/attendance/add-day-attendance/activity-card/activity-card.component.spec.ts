import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ActivityCardComponent } from "./activity-card.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { AttendanceItem } from "../../model/attendance-item";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "../../model/attendance-status";
import { EventWithAttendance } from "../../model/event-with-attendance";

const PRESENT: AttendanceStatusType = {
  id: "PRESENT",
  shortName: "P",
  label: "Present",
  countAs: AttendanceLogicalStatus.PRESENT,
};

function wrap(event: TestEventEntity): EventWithAttendance {
  return new EventWithAttendance(
    event,
    "attendance",
    "date",
    "relatesTo",
    "authors",
    undefined,
  );
}

describe("ActivityCardComponent", () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ActivityCardComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("event", wrap(TestEventEntity.create(new Date())));
    fixture.detectChanges();
  });

  it("warningLevel should be 'ok' when all attendance statuses are set", () => {
    const event = TestEventEntity.create(new Date());
    event.attendance = [
      new AttendanceItem(PRESENT, "", "child1"),
      new AttendanceItem(PRESENT, "", "child2"),
    ];
    fixture.componentRef.setInput("event", wrap(event));
    fixture.detectChanges();
    expect(component.warningLevel()).toBe("ok");
  });

  it("warningLevel should be 'warning' for recurring events with unknown attendances", () => {
    const event = TestEventEntity.create(new Date());
    event.attendance = [new AttendanceItem(undefined, "", "child1")];
    fixture.componentRef.setInput("event", wrap(event));
    fixture.componentRef.setInput("recurring", true);
    fixture.detectChanges();
    expect(component.warningLevel()).toBe("warning");
  });

  it("warningLevel should be 'urgent' for non-recurring events with unknown attendances", () => {
    const event = TestEventEntity.create(new Date());
    event.attendance = [new AttendanceItem(undefined, "", "child1")];
    fixture.componentRef.setInput("event", wrap(event));
    fixture.componentRef.setInput("recurring", false);
    fixture.detectChanges();
    expect(component.warningLevel()).toBe("urgent");
  });

  it("warningLevel should be 'ok' when attendance array is empty", () => {
    const event = TestEventEntity.create(new Date());
    event.attendance = [];
    fixture.componentRef.setInput("event", wrap(event));
    fixture.detectChanges();
    expect(component.warningLevel()).toBe("ok");
  });

  it("should return attendance items from the wrapped event", () => {
    const event = TestEventEntity.create(new Date());
    event.attendance = [new AttendanceItem(PRESENT, "", "child1")];
    fixture.componentRef.setInput("event", wrap(event));
    fixture.detectChanges();
    expect(component.attendance().length).toBe(1);
  });

  it("should return date from the wrapped event", () => {
    const testDate = new Date(2025, 5, 15);
    const event = TestEventEntity.create(testDate);
    fixture.componentRef.setInput("event", wrap(event));
    fixture.detectChanges();
    expect(component.event().date).toEqual(testDate);
  });
});
