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
    component.event = Note.create(new Date());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("warningLevel should be 'ok' when all attendance statuses are set", () => {
    component.event.attendance = [
      new AttendanceItem(PRESENT, "", "child1"),
      new AttendanceItem(PRESENT, "", "child2"),
    ];
    expect(component.warningLevel).toBe("ok");
  });

  it("warningLevel should be 'warning' for recurring events with unknown attendances", () => {
    component.event.attendance = [
      new AttendanceItem(undefined, "", "child1"),
    ];
    component.recurring = true;
    expect(component.warningLevel).toBe("warning");
  });

  it("warningLevel should be 'urgent' for non-recurring events with unknown attendances", () => {
    component.event.attendance = [
      new AttendanceItem(undefined, "", "child1"),
    ];
    component.recurring = false;
    expect(component.warningLevel).toBe("urgent");
  });

  it("warningLevel should be 'ok' when attendance array is empty", () => {
    component.event.attendance = [];
    expect(component.warningLevel).toBe("ok");
  });
});
