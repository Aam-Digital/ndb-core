import { Component, Input, OnInit } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ViewPropertyConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { Note } from "../model/note";
import { AttendanceLogicalStatus } from "../../attendance/model/attendance-status";

@Component({
  selector: "app-note-attendance-count-block",
  templateUrl: "./note-attendance-count-block.component.html",
  styleUrls: ["./note-attendance-count-block.component.scss"],
})
/**
 * Displays the amount of children with a given attendance status at a given note.
 */
export class NoteAttendanceCountBlockComponent
  implements OnInitDynamicComponent, OnInit {
  /**
   * The note on which the attendance should be counted.
   */
  @Input() note: Note;

  /**
   * The logical attendance status for which the attendance should be counted.
   */
  @Input() attendanceStatus: AttendanceLogicalStatus;

  participantsWithStatus: number;

  constructor() {}

  ngOnInit() {
    if (this.note) {
      this.participantsWithStatus = this.note.countWithStatus(
        this.attendanceStatus
      );
    }
  }

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    this.note = config.entity as Note;
    this.attendanceStatus = config.config.status as AttendanceLogicalStatus;
    this.ngOnInit();
  }
}
