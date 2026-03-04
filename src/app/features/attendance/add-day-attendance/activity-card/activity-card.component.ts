import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { RecurringActivity } from "../../model/recurring-activity";
import { AttendanceItem } from "../../model/attendance-item";
import { AttendanceDatatype } from "../../model/attendance.datatype";
import { MatCardModule } from "@angular/material/card";
import { BorderHighlightDirective } from "#src/app/core/common-components/border-highlight/border-highlight.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomDatePipe } from "#src/app/core/basic-datatypes/date/custom-date.pipe";
import { DateDatatype } from "#src/app/core/basic-datatypes/date/date.datatype";

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
   * The entity representing the event to be displayed.
   */
  readonly event = input.required<Entity>();

  /**
   * The property name of the attendance field on the entity.
   * If not provided, it is auto-detected from the entity schema.
   */
  readonly attendanceField = input<string>();

  /**
   * The property name of the date field on the entity.
   * If not provided, it is auto-detected as the first date/date-only field in the schema.
   */
  readonly dateField = input<string>();

  /**
   * An optional extra entity field to display on the card (e.g. "category").
   * The value's `label` property is shown if available, otherwise the raw value.
   */
  readonly extraField = input<string>();

  /**
   * Whether the event or activity is displayed in the style of events generated from a generic recurring activity.
   *
   * If not explicitly defined, it is inferred from the entity's `relatesTo` reference to a RecurringActivity.
   */
  readonly recurring = input<boolean>();

  /** Resolved date field name, auto-detected from schema if not explicitly set. */
  private readonly resolvedDateField = computed(() => {
    return this.dateField() ?? DateDatatype.detectFieldInEntity(this.event());
  });

  /** Resolved attendance field name, auto-detected from schema if not explicitly set. */
  private readonly resolvedAttendanceField = computed(
    () =>
      this.attendanceField() ??
      AttendanceDatatype.detectFieldInEntity(this.event()),
  );

  /** The attendance items for the current event. */
  readonly attendance = computed<AttendanceItem[]>(() => {
    const field = this.resolvedAttendanceField();
    if (!field) {
      return [];
    }
    return this.event()[field] ?? [];
  });

  /** Whether this event is linked to a recurring activity. */
  readonly isRecurring = computed(() => {
    const explicit = this.recurring();
    if (explicit !== undefined) {
      return explicit;
    }
    const event = this.event();
    return !!(event["relatesTo"] ?? "")
      .toString()
      .startsWith(RecurringActivity.ENTITY_TYPE);
  });

  /** Resolved date value from the entity. */
  readonly dateValue = computed<Date | undefined>(() => {
    const field = this.resolvedDateField();
    if (!field) {
      return undefined;
    }
    return this.event()[field];
  });

  /** Resolved display value of the extra field, if configured. */
  readonly extraFieldValue = computed<string | undefined>(() => {
    const field = this.extraField();
    if (!field) {
      return undefined;
    }
    const val = this.event()[field];
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
