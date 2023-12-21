import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { AttendanceService } from "../../attendance.service";
import { Note } from "../../../notes/model/note";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { NoteDetailsComponent } from "../../../notes/note-details/note-details.component";
import { FormDialogService } from "../../../../core/form-dialog/form-dialog.service";
import { AlertService } from "../../../../core/alerts/alert.service";
import { AlertDisplay } from "../../../../core/alerts/alert-display";
import { FormsModule, NgModel } from "@angular/forms";
import { FilterService } from "../../../../core/filter/filter.service";
import { DataFilter } from "../../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FilterConfig } from "../../../../core/entity-list/EntityListConfig";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { Angulartics2OnModule } from "angulartics2";
import { FilterComponent } from "../../../../core/filter/filter/filter.component";
import { NgForOf, NgIf } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { ActivityCardComponent } from "../../activity-card/activity-card.component";
import { MatButtonModule } from "@angular/material/button";
import { CurrentUserSubject } from "../../../../core/session/current-user-subject";

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
    NgIf,
    MatProgressBarModule,
    ActivityCardComponent,
    NgForOf,
    MatButtonModule,
  ],
  standalone: true,
})
export class RollCallSetupComponent implements OnInit {
  date = new Date();

  existingEvents: NoteForActivitySetup[] = [];
  filteredExistingEvents: NoteForActivitySetup[] = [];

  @Output() eventSelected = new EventEmitter<Note>();

  allActivities: RecurringActivity[] = [];
  visibleActivities: RecurringActivity[] = [];
  filterConfig: FilterConfig[] = [{ id: "category" }, { id: "schools" }];
  entityType = Note;

  showingAll = false;

  @ViewChild("dateField") dateField: NgModel;

  isLoading = true;

  /**
   * filters are displayed in the UI only if at least this many events are listed.
   *
   * This avoids displaying irrelevant filters for an empty or very short list.
   */
  readonly FILTER_VISIBLE_THRESHOLD = 4;

  constructor(
    private entityMapper: EntityMapperService,
    private attendanceService: AttendanceService,
    private currentUser: CurrentUserSubject,
    private formDialog: FormDialogService,
    private alertService: AlertService,
    private filerService: FilterService,
  ) {}

  async ngOnInit() {
    await this.initAvailableEvents();
  }

  private async initAvailableEvents() {
    this.isLoading = true;
    this.existingEvents =
      await this.attendanceService.getEventsWithUpdatedParticipants(this.date);
    await this.loadActivities();
    this.sortEvents();
    this.filteredExistingEvents = this.existingEvents;
    this.isLoading = false;
  }

  private async loadActivities() {
    this.allActivities = await this.entityMapper
      .loadType(RecurringActivity)
      .then((res) => res.filter((a) => a.isActive));

    if (this.showingAll) {
      this.visibleActivities = this.allActivities;
    } else {
      // TODO implement a generic function that finds the property where a entity has relations to another entity type (e.g. `authors` for `Note` when looking for `User`) to allow dynamic checks
      this.visibleActivities = this.allActivities.filter((a) =>
        a.isAssignedTo(this.currentUser.value.getId()),
      );
      if (this.visibleActivities.length === 0) {
        this.visibleActivities = this.allActivities.filter(
          (a) => a.assignedTo.length === 0,
        );
      }
      if (this.visibleActivities.length === 0) {
        this.visibleActivities = this.allActivities;
        this.showingAll = true;
      }
    }

    const newEvents = await Promise.all(
      this.visibleActivities.map((activity) =>
        this.createEventForActivity(activity),
      ),
    );
    this.existingEvents = this.existingEvents.concat(
      ...newEvents.filter((e) => !!e),
    );
  }

  async showMore() {
    this.showingAll = !this.showingAll;
    await this.initAvailableEvents();
  }

  async showLess() {
    this.showingAll = !this.showingAll;
    await this.initAvailableEvents();
  }

  async setNewDate(date: Date) {
    this.date = date;

    await this.initAvailableEvents();
  }

  private async createEventForActivity(
    activity: RecurringActivity,
  ): Promise<NoteForActivitySetup> {
    if (this.existingEvents.find((e) => e.relatesTo === activity.getId(true))) {
      return undefined;
    }

    const event = (await this.attendanceService.createEventForActivity(
      activity,
      this.date,
    )) as NoteForActivitySetup;
    event.authors = [this.currentUser.value.getId()];
    event.isNewFromActivity = true;
    return event;
  }

  private sortEvents() {
    const calculateEventPriority = (event: Note) => {
      let score = 0;

      const activityAssignedUsers = this.allActivities.find(
        (a) => a.getId(true) === event.relatesTo,
      )?.assignedTo;
      // use parent activities' assigned users and only fall back to event if necessary
      const assignedUsers = activityAssignedUsers ?? event.authors;

      if (!RecurringActivity.isActivityEventNote(event)) {
        // show one-time events first
        score += 1;
      }

      if (assignedUsers.includes(this.currentUser.value.getId())) {
        score += 2;
      }

      return score;
    };

    this.existingEvents.sort(
      (a, b) => calculateEventPriority(b) - calculateEventPriority(a),
    );
  }

  createOneTimeEvent() {
    const newNote = Note.create(new Date());
    newNote.authors = [this.currentUser.value.getId()];

    this.formDialog
      .openFormPopup(newNote, [], NoteDetailsComponent)
      .afterClosed()
      .subscribe((createdNote: Note) => {
        if (createdNote) {
          this.existingEvents.push(createdNote);
        }
      });
  }

  filterExistingEvents(filter: DataFilter<Note>) {
    const predicate = this.filerService.getFilterPredicate(filter);
    this.filteredExistingEvents = this.existingEvents.filter(predicate);
  }

  selectEvent(event: NoteForActivitySetup) {
    if (this.dateField.valid) {
      this.eventSelected.emit(event);
    } else {
      this.alertService.addWarning(
        $localize`:Alert when selected date is invalid:Invalid Date`,
        AlertDisplay.TEMPORARY,
      );
    }
  }
}

type NoteForActivitySetup = Note & { isNewFromActivity?: boolean };
