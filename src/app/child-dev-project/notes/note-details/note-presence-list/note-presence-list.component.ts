import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { Note } from "../../model/note";
import { NgForm } from "@angular/forms";
import { ChildSelectComponent } from "../../../children/child-select/child-select.component";
import { AttendanceLogicalStatus } from "../../../attendance/model/attendance-status";

@Component({
  selector: "app-note-presence-list",
  templateUrl: "./note-presence-list.component.html",
  styleUrls: ["./note-presence-list.component.scss"],
})
export class NotePresenceListComponent implements OnChanges {
  @Input() entity: Note = new Note("");
  @Input() recordForm: NgForm;

  @ViewChild("childSelect", { static: true })
  childSelectComponent: ChildSelectComponent;

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
