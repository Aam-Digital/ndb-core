import { Component, Input } from "@angular/core";
import { Note } from "../../notes/model/note";

@Component({
  selector: "app-activity-card",
  templateUrl: "./activity-card.component.html",
  styleUrls: ["./activity-card.component.scss"],
})
export class ActivityCardComponent {
  @Input() event: Note;
  @Input() highlighted: boolean;
}
