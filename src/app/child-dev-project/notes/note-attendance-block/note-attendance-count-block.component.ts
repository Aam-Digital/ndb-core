import { Component, Input, OnChanges } from "@angular/core";
import { Note } from "../model/note";
import { AttendanceLogicalStatus } from "../../attendance/model/attendance-status";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";

/**
 * Displays the amount of children with a given attendance status at a given note.
 */
@DynamicComponent("NoteAttendanceCountBlock")
@Component({
  selector: "app-note-attendance-count-block",
  template: `{{ participantsWithStatus }}`,
  standalone: true,
})
export class NoteAttendanceCountBlockComponent implements OnChanges {
  /**
   * The note on which the attendance should be counted.
   */
  @Input() entity: Note;

  /**
   * The logical attendance status for which the attendance should be counted.
   */
  @Input() config: { status: AttendanceLogicalStatus };

  participantsWithStatus: number;

  ngOnChanges() {
    if (this.entity) {
      this.participantsWithStatus = this.entity.countWithStatus(
        this.config.status
      );
    }
  }
}
