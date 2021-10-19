import { Component, Input } from "@angular/core";
import { Note } from "../../notes/model/note";
import { RecurringActivity } from "../model/recurring-activity";

@Component({
  selector: "app-activity-card",
  templateUrl: "./activity-card.component.html",
  styleUrls: ["./activity-card.component.scss"],
})
export class ActivityCardComponent {
  /**
   * The Note representing the event to be displayed
   */
  @Input() event: Note;

  /**
   * Whether the card is visualized as selected
   */
  @Input() highlighted: boolean;

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

  get isUrgent(): boolean {
    return !this.recurring && this.event.hasUnknownAttendances();
  }

  get isComplete(): boolean {
    return !this.event.hasUnknownAttendances();
  }
}
