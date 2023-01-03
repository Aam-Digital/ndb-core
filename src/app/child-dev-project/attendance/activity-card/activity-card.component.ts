import { Component, Input } from "@angular/core";
import { Note } from "../../notes/model/note";
import { RecurringActivity } from "../model/recurring-activity";
import { MatCardModule } from "@angular/material/card";
import { BorderHighlightDirective } from "../../../core/common-components/border-highlight/border-highlight.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DatePipe, NgIf } from "@angular/common";

@Component({
  selector: "app-activity-card",
  templateUrl: "./activity-card.component.html",
  styleUrls: ["./activity-card.component.scss"],
  imports: [
    MatCardModule,
    BorderHighlightDirective,
    FontAwesomeModule,
    DatePipe,
    NgIf,
  ],
  standalone: true,
})
export class ActivityCardComponent {
  /**
   * The Note representing the event to be displayed
   */
  @Input() event: Note;

  private _displayAsRecurring: boolean | null = null;

  /**
   * Whether the event or activity is displayed in the style of events generated from a generic recurring activity.
   *
   * If not explicitly defined, it is inferred from the given event Note's reference to an activity.
   */
  @Input() set recurring(value: boolean) {
    this._displayAsRecurring = value;
  }

  get recurring(): boolean {
    if (this._displayAsRecurring !== null) {
      return this._displayAsRecurring;
    } else {
      return RecurringActivity.isActivityEventNote(this.event);
    }
  }

  get warningLevel(): "ok" | "warning" | "urgent" {
    if (!this.event.hasUnknownAttendances()) {
      return "ok";
    } else if (!this.recurring && this.event.hasUnknownAttendances()) {
      return "urgent";
    } else {
      return "warning";
    }
  }
}
