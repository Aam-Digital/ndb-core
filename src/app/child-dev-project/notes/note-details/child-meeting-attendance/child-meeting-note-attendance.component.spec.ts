
import { ChildMeetingNoteAttendanceComponent } from './child-meeting-note-attendance.component';
import { MeetingNoteAttendance } from '../../meeting-note-attendance';

describe('ChildMeetingAttendanceComponent', () => {
  let component: ChildMeetingNoteAttendanceComponent;

  beforeEach(() => {
    component = new ChildMeetingNoteAttendanceComponent();
    component.noteChildAttendance = new MeetingNoteAttendance('child1');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
