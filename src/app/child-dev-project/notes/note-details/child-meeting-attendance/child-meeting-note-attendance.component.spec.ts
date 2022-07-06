import { ChildMeetingNoteAttendanceComponent } from "./child-meeting-note-attendance.component";
import { EventNote } from "../../../attendance/model/event-note";

describe("ChildMeetingAttendanceComponent", () => {
  let component: ChildMeetingNoteAttendanceComponent;

  beforeEach(() => {
    component = new ChildMeetingNoteAttendanceComponent();
    component.entity = EventNote.create(new Date());
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
