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

@Component({
  selector: "app-note-presence-list",
  templateUrl: "./note-presence-list.component.html",
  styleUrls: ["./note-presence-list.component.scss"],
})
export class NotePresenceListComponent implements OnChanges {
  @Input() entity: Note = new Note("");
  @Input() recordForm: NgForm;
  smallScreen: boolean;

  @ViewChild("childSelect", { static: true })
  childSelectComponent: ChildSelectComponent;

  constructor() {
    this.smallScreen = window.innerWidth < 500;
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

    this.entity.attendances.sort((a, b) => {
      if (a.present === b.present) {
        return 0;
      }
      if (a.present) {
        return -1;
      }
      return 1;
    });
  }
}
