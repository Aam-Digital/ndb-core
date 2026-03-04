import {
  Component,
  inject,
  Injectable,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { Location } from "@angular/common";
import { animate, style, transition, trigger } from "@angular/animations";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
} from "../../model/attendance-status";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { AttendanceItem } from "../../model/attendance-item";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { Logging } from "#src/app/core/logging/logging.service";
import { sortByAttribute } from "#src/app/utils/utils";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RollCallTabComponent } from "./roll-call-tab/roll-call-tab.component";
import {
  HAMMER_GESTURE_CONFIG,
  HammerGestureConfig,
  HammerModule,
} from "@angular/platform-browser";
import Hammer from "hammerjs";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { ActivatedRoute, Router } from "@angular/router";
import { AttendanceService } from "../../attendance.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import { ConfirmationDialogButton } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { RouteTarget } from "#src/app/route-target";

// Only allow horizontal swiping
@Injectable()
class HorizontalHammerConfig extends HammerGestureConfig {
  override overrides = {
    swipe: { direction: Hammer.DIRECTION_HORIZONTAL },
    pinch: { enable: false },
    rotate: { enable: false },
  };
}

/**
 * Displays the participants of the given event one by one to mark attendance status.
 * Can be used as a standalone routed view (via route param :id) or embedded with eventEntity input.
 */
@RouteTarget("RollCall")
@Component({
  selector: "app-roll-call",
  templateUrl: "./roll-call.component.html",
  styleUrls: ["./roll-call.component.scss"],
  animations: [
    trigger("completeRollCall", [
      transition("void => *", [
        style({ backgroundColor: "transparent" }),
        animate(1000),
      ]),
    ]),
  ],
  imports: [
    MatProgressBarModule,
    MatButtonModule,
    FontAwesomeModule,
    EntityBlockComponent,
    RollCallTabComponent,
    HammerModule,
    MatTooltipModule,
    ViewTitleComponent,
  ],
  providers: [
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: HorizontalHammerConfig,
    },
  ],
})
export class RollCallComponent implements OnChanges {
  private enumService = inject(ConfigurableEnumService);
  private entityMapper = inject(EntityMapperService);
  private formDialog = inject(FormDialogService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private router = inject(Router);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private attendanceService = inject(AttendanceService);
  private currentUser = inject(CurrentUserSubject);
  private unsavedChanges = inject(UnsavedChangesService);

  /**
   * Entity ID from route param, mapped by RoutedViewComponent.
   * Supports real entity IDs, or "new" for creating a new event.
   */
  @Input() id: string;

  /**
   * The event to be displayed and edited.
   * Can be set directly when used as an embedded component, or loaded from DB via id.
   */
  @Input() eventEntity: Note;

  /**
   * (optional) property name of the participant entities by which they are sorted
   */
  @Input() sortParticipantsBy?: string;

  /**
   * The index, participant and attendance that is currently being processed
   */
  currentIndex = 0;
  currentParticipant: Entity;
  currentAttendance: AttendanceItem;
  /**
   * whether any changes have been made to the model
   */
  isDirty: boolean = false;

  /** whether the event is being loaded */
  isLoading: boolean = false;

  /** lookup object for attendance items by participant ID, built during loadParticipants */
  attendanceByParticipant: Record<string, AttendanceItem> = {};

  /** options available for selecting an attendance status */
  availableStatus: AttendanceStatusType[];

  participants: Entity[] = [];
  inactiveParticipants: Entity[];

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.id && this.id) {
      await this.loadEventFromRoute();
    }
    if (changes.eventEntity && this.eventEntity) {
      this.loadAttendanceStatusTypes();
      await this.loadParticipants();
      this.setInitialIndex();
    }
    if (changes.sortParticipantsBy) {
      this.sortParticipants();
    }
  }

  /**
   * Load or create the event based on the route id and query params.
   */
  private async loadEventFromRoute() {
    this.isLoading = true;

    if (this.id === "new") {
      const activityId = this.route.snapshot.queryParamMap.get("activity");
      const dateStr = this.route.snapshot.queryParamMap.get("date");
      const date = dateStr ? new Date(dateStr) : new Date();

      if (activityId) {
        this.eventEntity = (await this.createRecurringEvent(
          activityId,
          date,
        )) as Note;
      } else {
        this.eventEntity = await this.createOneTimeEvent(date);
      }
    } else {
      this.eventEntity = (await this.loadExistingEvent(this.id)) as Note;
    }

    if (this.eventEntity) {
      this.loadAttendanceStatusTypes();
      await this.loadParticipants();
      this.setInitialIndex();
    }

    this.isLoading = false;
  }

  private async createRecurringEvent(
    activityId: string,
    date: Date,
  ): Promise<Entity> {
    const activity = await this.entityMapper.load(
      RecurringActivity,
      activityId,
    );
    const newEvent = await this.attendanceService.createEventForActivity(
      activity,
      date,
    );

    if (this.currentUser.value && newEvent instanceof Note) {
      newEvent.authors = [this.currentUser.value.getId()];
    }
    return newEvent;
  }

  /**
   * Open a dialog for creating a one-time event and use it for the roll call.
   */
  private async createOneTimeEvent(date?: Date): Promise<Note | undefined> {
    const newNote = Note.create(date ?? new Date());
    if (this.currentUser.value) {
      newNote.authors = [this.currentUser.value.getId()];
    }

    const dialogRef = this.formDialog.openView(newNote, "NoteDetails");
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      return result;
    }
    this.location.back();
    return undefined;
  }

  private async loadExistingEvent(id: string): Promise<Entity | undefined> {
    let event: Entity;
    try {
      const entityType = Entity.extractTypeFromId(this.id);
      event = await this.entityMapper.load(entityType, this.id);
    } catch (e) {
      Logging.warn("Could not load event " + this.id, e);
      void this.router.navigate(["/404"]);
    }
    return event;
  }

  /**
   * Set the index of the first child that expects user input.
   * This is the first entry of the list, if the user has never recorded attendance
   * for this event. Else it is the first child without any attendance information
   * (i.e. got skipped or the user left at this child)
   * @private
   */
  private setInitialIndex() {
    let index = 0;
    for (const entry of this.participants) {
      if (!this.attendanceByParticipant[entry.getId()]?.status?.id) {
        break;
      }
      index += 1;
    }

    // do not jump to end - if all participants are recorded, start with first instead
    if (index >= this.participants.length) {
      index = 0;
    }

    this.goToParticipantWithIndex(index);
  }

  private loadAttendanceStatusTypes() {
    this.availableStatus = this.enumService.getEnumValues<AttendanceStatusType>(
      ATTENDANCE_STATUS_CONFIG_ID,
    );
  }

  private async loadParticipants() {
    this.participants = [];
    this.inactiveParticipants = [];
    this.attendanceByParticipant = {};

    for (const attendanceItem of this.eventEntity.childrenAttendance) {
      const childId = attendanceItem.participant;
      let child: Entity;
      try {
        child = await this.entityMapper.load(
          Entity.extractTypeFromId(childId),
          childId,
        );
      } catch (e) {
        Logging.debug(
          "Could not find child " +
            childId +
            " for event " +
            this.eventEntity.getId(),
        );
        this.eventEntity.removeChild(childId);
        this.eventEntity.childrenAttendance =
          this.eventEntity.childrenAttendance.filter(
            (a) => a.participant !== childId,
          );
        continue;
      }

      this.attendanceByParticipant[childId] = attendanceItem;

      if (child.isActive) {
        this.participants.push(child);
      } else {
        this.inactiveParticipants.push(child);
      }
    }
    this.sortParticipants();
  }

  private sortParticipants() {
    if (!this.sortParticipantsBy) {
      return;
    }

    this.participants.sort(
      sortByAttribute<any>(this.sortParticipantsBy, "asc"),
    );
    // also sort the participants in the entity itself for display in details view later
    const sortedIds = this.participants.map((e) => e.getId());
    this.eventEntity.childrenAttendance.sort(
      (a, b) =>
        sortedIds.indexOf(a.participant) - sortedIds.indexOf(b.participant),
    );
  }

  markAttendance(status: AttendanceStatusType) {
    this.currentAttendance.status = status;
    this.isDirty = true;
    this.unsavedChanges.pending = true;

    this.goToParticipantWithIndex(this.currentIndex + 1);
  }

  goToParticipantWithIndex(newIndex: number) {
    this.currentIndex = Math.max(
      0,
      Math.min(newIndex, this.participants.length),
    );

    if (this.isFinished) {
      void this.saveEvent();
    } else {
      this.currentParticipant = this.participants[this.currentIndex];
      this.currentAttendance =
        this.attendanceByParticipant[this.currentParticipant.getId()];
    }
  }

  get isFirst(): boolean {
    return this.currentIndex === 0;
  }

  get isLast(): boolean {
    return this.currentIndex === this.participants.length - 1;
  }

  get isFinished(): boolean {
    return this.currentIndex >= this.participants.length;
  }

  finish() {
    this.location.back();
  }

  /**
   * Handle navigating back, showing save/discard dialog if there are unsaved changes.
   */
  exit() {
    if (this.isDirty) {
      this.confirmationDialog.getConfirmation(
        $localize`:Exit from the current screen:Exit`,
        $localize`Do you want to save your progress before going back?`,
        [
          {
            text: $localize`Save`,
            click: (): boolean => {
              void this.saveEvent().then(() => this.location.back());
              return true;
            },
          },
          {
            text: $localize`:Discard changes made to a form:Discard`,
            click: (): boolean => {
              this.isDirty = false;
              this.unsavedChanges.pending = false;
              this.location.back();
              return false;
            },
          },
        ] as ConfirmationDialogButton[],
        true,
      );
    } else {
      this.location.back();
    }
  }

  async saveEvent() {
    if (this.eventEntity) {
      await this.entityMapper.save(this.eventEntity);
      this.isDirty = false;
      this.unsavedChanges.pending = false;
    }
  }

  showDetails() {
    this.formDialog.openView(this.eventEntity, "NoteDetails");
  }

  async includeInactive() {
    const confirmation = await this.confirmationDialog.getConfirmation(
      $localize`Also include archived participants?`,
      $localize`This event has some participants who are "archived". We automatically remove them from the attendance list for you. Do you want to also include archived participants for this event?`,
    );
    if (confirmation) {
      this.participants = [...this.participants, ...this.inactiveParticipants];
      this.inactiveParticipants = [];
    }
  }
}
