import { ChildMeetingNoteAttendanceComponent } from "./child-meeting-note-attendance.component";
import { EventAttendance } from "../../../attendance/model/event-attendance";

describe("ChildMeetingAttendanceComponent", () => {
  let component: ChildMeetingNoteAttendanceComponent;

  beforeEach(() => {
    component = new ChildMeetingNoteAttendanceComponent();
    component.childId = "child1";
    component.attendance = new EventAttendance();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
