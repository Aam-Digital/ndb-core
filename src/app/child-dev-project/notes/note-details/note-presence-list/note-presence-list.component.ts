import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Note } from "../../model/note";
import { NgForm } from "@angular/forms";
import { AttendanceLogicalStatus } from "../../../attendance/model/attendance-status";
import { EntityConstructor } from "../../../../core/entity/entity";
import { Child } from "../../../children/model/child";

/**
 * Display the participants' of an event in a list allowing each attendance status to be edited.
 */
@Component({
  selector: "app-note-presence-list",
  templateUrl: "./note-presence-list.component.html",
  styleUrls: ["./note-presence-list.component.scss"],
})
export class NotePresenceListComponent implements OnChanges {
  @Input() entity: Note = new Note("");
  @Input() recordForm: NgForm;

  readonly Child: EntityConstructor<Child> = Child;

  constructor() {
    this.sortEntries();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entity")) {
      this.sortEntries();
    }
  }

  private sortEntries() {
    if (!this.entity) {
      return;
    }

    this.entity.children.sort((a, b) => {
      const statusA = this.entity.getAttendance(b).status;
      const statusB = this.entity.getAttendance(b).status;

      if (statusA === statusB) {
        return 0;
      }
      if (statusA.countAs === AttendanceLogicalStatus.PRESENT) {
        return -1;
      }
      return statusA.localeCompare(statusB);
    });
  }
}
