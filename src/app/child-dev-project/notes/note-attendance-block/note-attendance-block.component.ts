import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ViewPropertyConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { Note } from "../model/note";
import { AttendanceLogicalStatus } from "../../attendance/model/attendance-status";

@Component({
  selector: "app-note-attendance-block",
  templateUrl: "./note-attendance-block.component.html",
  styleUrls: ["./note-attendance-block.component.scss"],
})
export class NoteAttendanceBlockComponent implements OnInitDynamicComponent {
  participantsWithStatus: number;

  constructor() {}

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    const note = config.entity as Note;
    const attendanceStatus = config.config.status as AttendanceLogicalStatus;
    this.participantsWithStatus = note.countWithStatus(attendanceStatus);
  }
}
