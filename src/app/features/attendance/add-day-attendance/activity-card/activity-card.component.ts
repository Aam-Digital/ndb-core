import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { AttendanceItem } from "../../model/attendance-item";
import { EventWithAttendance } from "../../model/event-with-attendance";
import { MatCardModule } from "@angular/material/card";
import { BorderHighlightDirective } from "#src/app/core/common-components/border-highlight/border-highlight.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomDatePipe } from "#src/app/core/basic-datatypes/date/custom-date.pipe";

/**
 * Simple representation of an event
 * in the context of setting up or selecting an event for a roll call.
 */
@Component({
  selector: "app-activity-card",
  templateUrl: "./activity-card.component.html",
  styleUrls: ["./activity-card.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    BorderHighlightDirective,
    FontAwesomeModule,
    CustomDatePipe,
  ],
})
export class ActivityCardComponent {
  /**
   * The event to be displayed.
   */
  readonly event = input.required<EventWithAttendance>();

  /**
   * An optional extra entity field to display on the card (e.g. "category").
   * The value's `label` property is shown if available, otherwise the raw value.
   */
  readonly extraField = computed(() => this.event().extraField);

  /**
   * Whether the event or activity is displayed in the style of events generated from a generic recurring activity.
   *
   * If not explicitly defined, it is inferred from the entity's `relatesTo` reference to a RecurringActivity.
   */
  readonly recurring = input<boolean>();

  /** The attendance items for the current event. */
  readonly attendance = computed<AttendanceItem[]>(
    () => this.event().attendanceItems,
  );

  /** Whether this event is linked to a recurring activity. */
  readonly isRecurring = computed(() => {
    const explicit = this.recurring();
    if (explicit !== undefined) {
      return explicit;
    }
    return this.event().isActivityEvent;
  });

  /** Resolved display value of the extra field, if configured. */
  readonly extraFieldValue = computed<string | undefined>(() => {
    const field = this.extraField();
    if (!field) {
      return undefined;
    }
    const val = this.event().entity[field];
    return val?.label ?? val;
  });

  readonly warningLevel = computed<"ok" | "warning" | "urgent">(() => {
    const att = this.attendance();
    const hasUnknown = att.some((a) => !a.status?.id);
    if (!hasUnknown) {
      return "ok";
    }
    return this.isRecurring() ? "warning" : "urgent";
  });
}
