import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
} from "@angular/core";
import { AttendanceService } from "../../attendance.service";
import { ActivityEvent, isActivityEvent } from "../../model/activity-event";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { AlertDisplay } from "#src/app/core/alerts/alert-display";
import { FormsModule, NgModel } from "@angular/forms";
import { FilterService } from "#src/app/core/filter/filter.service";
import { FilterConfig } from "#src/app/core/entity-list/EntityListConfig";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { Angulartics2OnModule } from "angulartics2";
import { FilterComponent } from "#src/app/core/filter/filter/filter.component";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { ActivityCardComponent } from "../activity-card/activity-card.component";
import { MatButtonModule } from "@angular/material/button";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { Router } from "@angular/router";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { RouteTarget } from "#src/app/route-target";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { OkButton } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { EventWithAttendance } from "../../model/event-with-attendance";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Set up or select a roll call event for a specific date
 * (either one-time or related to a recurring activity).
 */
@RouteTarget("AddDayAttendance")
@Component({
  selector: "app-roll-call-setup",
  templateUrl: "./roll-call-setup.component.html",
  styleUrls: ["./roll-call-setup.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatDatepickerModule,
    Angulartics2OnModule,
    FilterComponent,
    MatProgressBarModule,
    ActivityCardComponent,
    MatButtonModule,
    ViewTitleComponent,
  ],
})
export class RollCallSetupComponent {
  private readonly attendanceService = inject(AttendanceService);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  private readonly filterService = inject(FilterService);
  private readonly confirmationService = inject(ConfirmationDialogService);

  /**
   * filters are displayed in the UI only if at least this many events are listed.
   *
   * This avoids displaying irrelevant filters for an empty or very short list.
   */
  readonly FILTER_VISIBLE_THRESHOLD = 4;

  /**
   * Configuration for the filter UI shown above the events list.
   */
  readonly filterConfig = input<FilterConfig[]>(
    this.attendanceService.rollCallConfig.filterConfig,
  );

  /**
   * The entity field name to display as an extra info on each event card.
   */
  readonly extraField = input<string>(
    this.attendanceService.rollCallConfig.extraField,
  );

  date = signal(new Date());

  protected readonly eventsResource = resource<
    { events: EventWithAttendance[]; allEvents: EventWithAttendance[] },
    Date
  >({
    params: () => this.date(),
    loader: ({ params: date }) =>
      this.attendanceService.getAvailableEventsForRollCall(date),
  });

  /**
   * Whether all events are shown (not just the user's own).
   * Resets to the default (true when own === all) whenever new data loads.
   */
  showingAll = linkedSignal(() => {
    const result = this.eventsResource.value();
    return result !== undefined ? result.events.length === 0 : false;
  });

  /** The active base set: either user-filtered or all, depending on showingAll. */
  activeEvents = computed<EventWithAttendance[]>(() => {
    const result = this.eventsResource.value();
    const events = this.showingAll() ? result?.allEvents : result?.events;
    return events ?? [];
  });

  /**
   * The events currently shown, after applying any active filter.
   * Resets to the full active set whenever the active set changes.
   */
  filteredEvents = linkedSignal<EventWithAttendance[]>(() =>
    this.activeEvents(),
  );

  @ViewChild("dateField") dateField: NgModel;

  /** Raw entities from the active event set, used for filter schema look-ups and filter predicate evaluation. */
  entityList = computed(() => this.activeEvents().map((e) => e.entity));

  /**
   * The entity type inferred from the loaded events, used for filter schema look-ups.
   */
  entityType = computed(
    () =>
      this.activeEvents()[0]?.entity.constructor as
        | EntityConstructor
        | undefined,
  );

  showMore() {
    this.showingAll.set(true);
  }

  showLess() {
    this.showingAll.set(false);
  }

  private formatDateForQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  createOneTimeEvent() {
    this.confirmationService.getConfirmation(
      $localize`Please create a Recurring Activity`,
      $localize`To record attendance, you need to first create a Recurring Activity (or an individual event record for the selected date).`,
      OkButton,
    );

    // TODO: enable routing to create a one-time event again after we implemented a generically configurable version of this.
    // this.router.navigate(["/attendance/add-day", "new"], {
    //   queryParams: {
    //     date: this.formatDateForQuery(this.date),
    //   },
    // });
  }

  filterExistingEvents(filter: DataFilter<Entity>) {
    const predicate = this.filterService.getFilterPredicate(filter);
    this.filteredEvents.set(
      this.activeEvents().filter((e) => predicate(e.entity)),
    );
  }

  selectEvent(event: EventWithAttendance) {
    if (!this.dateField?.valid) {
      this.alertService.addWarning(
        $localize`:Alert when selected date is invalid:Invalid Date`,
        AlertDisplay.TEMPORARY,
      );
      return;
    }

    const entity = event.entity;
    if (entity.isNew && isActivityEvent(entity)) {
      this.router.navigate(["/attendance/add-day", "new"], {
        queryParams: {
          activity: (entity as ActivityEvent).relatesTo,
          date: this.formatDateForQuery(event.date),
        },
      });
    } else {
      this.router.navigate(["/attendance/add-day", entity.getId()]);
    }
  }
}
