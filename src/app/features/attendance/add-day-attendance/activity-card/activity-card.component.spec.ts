import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ActivityCardComponent } from "./activity-card.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { AttendanceItem } from "../../model/attendance-item";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "../../model/attendance-status";

const PRESENT: AttendanceStatusType = {
  id: "PRESENT",
  shortName: "P",
  label: "Present",
  countAs: AttendanceLogicalStatus.PRESENT,
};

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
    fixture.componentRef.setInput("event", Note.create(new Date()));
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("warningLevel should be 'ok' when all attendance statuses are set", () => {
    const event = Note.create(new Date());
    event.childrenAttendance = [
      new AttendanceItem(PRESENT, "", "child1"),
      new AttendanceItem(PRESENT, "", "child2"),
    ];
    fixture.componentRef.setInput("event", event);
    fixture.detectChanges();
    expect(component.warningLevel()).toBe("ok");
  });

  it("warningLevel should be 'warning' for recurring events with unknown attendances", () => {
    const event = Note.create(new Date());
    event.childrenAttendance = [new AttendanceItem(undefined, "", "child1")];
    fixture.componentRef.setInput("event", event);
    fixture.componentRef.setInput("recurring", true);
    fixture.detectChanges();
    expect(component.warningLevel()).toBe("warning");
  });

  it("warningLevel should be 'urgent' for non-recurring events with unknown attendances", () => {
    const event = Note.create(new Date());
    event.childrenAttendance = [new AttendanceItem(undefined, "", "child1")];
    fixture.componentRef.setInput("event", event);
    fixture.componentRef.setInput("recurring", false);
    fixture.detectChanges();
    expect(component.warningLevel()).toBe("urgent");
  });

  it("warningLevel should be 'ok' when attendance array is empty", () => {
    const event = Note.create(new Date());
    event.childrenAttendance = [];
    fixture.componentRef.setInput("event", event);
    fixture.detectChanges();
    expect(component.warningLevel()).toBe("ok");
  });

  it("should auto-detect attendance field from entity schema", () => {
    const event = Note.create(new Date());
    event.childrenAttendance = [new AttendanceItem(PRESENT, "", "child1")];
    fixture.componentRef.setInput("event", event);
    fixture.detectChanges();
    expect(component.attendance().length).toBe(1);
  });

  it("should auto-detect date field from entity schema", () => {
    const testDate = new Date(2025, 5, 15);
    const event = Note.create(testDate);
    fixture.componentRef.setInput("event", event);
    fixture.detectChanges();
    expect(component.dateValue()).toEqual(testDate);
  });

  it("should use explicit dateField input if provided", () => {
    const testDate = new Date(2025, 5, 15);
    const event = Note.create(testDate);
    fixture.componentRef.setInput("event", event);
    fixture.componentRef.setInput("dateField", "date");
    fixture.detectChanges();
    expect(component.dateValue()).toEqual(testDate);
  });
});
