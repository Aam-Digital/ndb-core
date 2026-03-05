import { Component, OnInit, ViewChild, inject, input } from "@angular/core";
import { AttendanceService } from "../../attendance.service";
import { isActivityEvent } from "../../model/activity-event";
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
export class RollCallSetupComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  private readonly filterService = inject(FilterService);
  private readonly confirmationService = inject(ConfirmationDialogService);

  /**
   * Configuration for the filter UI shown above the events list.
   */
  readonly filterConfig = input<FilterConfig[]>(
    this.attendanceService.rollCallFilterConfig,
  );

  /**
   * The entity field name to display as an extra info on each event card.
   */
  readonly extraField = input<string>(
    this.attendanceService.rollCallExtraField,
  );

  /**
   * The entity field name holding the event date, used when routing to a new roll call.
   */
  readonly eventDateField = input<string>(
    this.attendanceService.rollCallDateField,
  );

  date = new Date();

  /** Events relevant to the current user (filtered by assignment). */
  ownEvents: Entity[] = [];
  /** All available events regardless of user assignment. */
  allEvents: Entity[] = [];

  /** The active base set: either user-filtered or all, depending on showingAll. */
  get activeEvents(): Entity[] {
    return this.showingAll ? this.allEvents : this.ownEvents;
  }

  /** The events currently shown, after applying any active filter. */
  filteredEvents: Entity[] = [];

  showingAll = false;

  @ViewChild("dateField") dateField: NgModel;

  isLoading = true;

  /**
   * filters are displayed in the UI only if at least this many events are listed.
   *
   * This avoids displaying irrelevant filters for an empty or very short list.
   */
  readonly FILTER_VISIBLE_THRESHOLD = 4;

  /**
   * The entity type inferred from the loaded events, used for filter schema look-ups.
   */
  get entityType(): EntityConstructor | undefined {
    return this.activeEvents[0]?.constructor as EntityConstructor | undefined;
  }

  async ngOnInit() {
    await this.initAvailableEvents();
  }

  private async initAvailableEvents() {
    this.isLoading = true;
    const result = await this.attendanceService.getAvailableEventsForRollCall(
      this.date,
    );
    this.ownEvents = result.events;
    this.allEvents = result.allEvents;
    this.showingAll = this.ownEvents === this.allEvents;
    this.filteredEvents = this.activeEvents;
    this.isLoading = false;
  }

  showMore() {
    this.showingAll = true;
    this.filteredEvents = this.allEvents;
  }

  showLess() {
    this.showingAll = false;
    this.filteredEvents = this.ownEvents;
  }

  async setNewDate(date: Date) {
    this.date = date;
    await this.initAvailableEvents();
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
    this.filteredEvents = this.activeEvents.filter(predicate);
  }

  selectEvent(event: Entity) {
    if (!this.dateField?.valid) {
      this.alertService.addWarning(
        $localize`:Alert when selected date is invalid:Invalid Date`,
        AlertDisplay.TEMPORARY,
      );
      return;
    }

    if (event.isNew && isActivityEvent(event)) {
      this.router.navigate(["/attendance/add-day", "new"], {
        queryParams: {
          activity: event.relatesTo,
          date: this.formatDateForQuery(event[this.eventDateField()]),
        },
      });
    } else {
      this.router.navigate(["/attendance/add-day", event.getId()]);
    }
  }
}
