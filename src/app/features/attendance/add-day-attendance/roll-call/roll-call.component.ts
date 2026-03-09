import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injectable,
  input,
  resource,
  ResourceRef,
  signal,
  untracked,
} from "@angular/core";
import { Location } from "@angular/common";
import { animate, style, transition, trigger } from "@angular/animations";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
} from "../../model/attendance-status";
import { AttendanceItem } from "../../model/attendance-item";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { Logging } from "#src/app/core/logging/logging.service";
import { sortByAttribute } from "#src/app/utils/utils";
import { EventWithAttendance } from "../../model/event-with-attendance";
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
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import {
  ConfirmationDialogButton,
  OkButton,
} from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class RollCallComponent {
  private readonly enumService = inject(ConfigurableEnumService);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly formDialog = inject(FormDialogService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly attendanceService = inject(AttendanceService);
  private readonly unsavedChanges = inject(UnsavedChangesService);

  /**
   * Entity ID from route param, mapped by RoutedViewComponent.
   * Supports real entity IDs, or "new" for creating a new event.
   */
  readonly id = input<string>();

  /**
   * The event to be displayed and edited.
   * Can be set directly when used as an embedded component, or loaded from DB via id.
   */
  readonly eventEntity = input<EventWithAttendance>();

  /**
   * (optional) property name of the participant entities by which they are sorted
   */
  readonly sortParticipantsBy = input<string>();

  /**
   * Loads the event entity from the provided input or by ID.
   * Unifies the two input paths (direct entity vs route-based loading).
   */
  readonly eventResource: ResourceRef<EventWithAttendance | undefined> =
    resource({
      params: () => ({ entity: this.eventEntity(), id: this.id() }),
      loader: async ({ params: { entity, id } }) => {
        if (entity) return entity;
        if (!id) return undefined;
        if (id === "new") return this.createEventFromRoute();
        return this.loadExistingEvent(id);
      },
    });

  /** The resolved event, wrapped with typed attendance and date accessors. */
  readonly event = computed<EventWithAttendance | undefined>(() => {
    return this.eventResource.value();
  });

  /** The index of the participant currently being processed */
  readonly currentIndex = signal(0);

  /** The participant currently being processed */
  readonly currentParticipant = computed(() => {
    const p = this.participants();
    const i = this.currentIndex();
    return i < p.length ? p[i] : undefined;
  });

  /** The attendance item of the current participant */
  readonly currentAttendance = computed(() => {
    const participant = this.currentParticipant();
    return participant
      ? this.attendanceByParticipant()[participant.getId()]
      : undefined;
  });

  /** Whether any changes have been made to the model */
  readonly isDirty = signal(false);

  /** Lookup object for attendance items by participant ID, built during loadParticipants */
  readonly attendanceByParticipant = signal<Record<string, AttendanceItem>>({});

  /** Options available for selecting an attendance status */
  readonly availableStatus = signal<AttendanceStatusType[]>([]);

  readonly participants = signal<Entity[]>([]);
  readonly inactiveParticipants = signal<Entity[]>([]);

  readonly isFirst = computed(() => this.currentIndex() === 0);
  readonly isLast = computed(
    () => this.currentIndex() === this.participants().length - 1,
  );
  readonly isFinished = computed(
    () => this.currentIndex() >= this.participants().length,
  );

  constructor() {
    // Initialize participants when event is loaded/resolved
    effect(() => {
      const event = this.event();
      if (event) {
        untracked(() => this.initializeForEvent());
      }
    });

    // React to sort configuration changes
    effect(() => {
      this.sortParticipantsBy();
      untracked(() => this.sortParticipants());
    });
  }

  /**
   * Initialize participant data for the current event entity.
   */
  private async initializeForEvent() {
    this.loadAttendanceStatusTypes();
    await this.loadParticipants();
    this.setInitialIndex();
  }

  /**
   * Create or load a new event based on route query params.
   */
  private async createEventFromRoute(): Promise<
    EventWithAttendance | undefined
  > {
    const activityId = this.route.snapshot.queryParamMap.get("activity");
    const dateStr = this.route.snapshot.queryParamMap.get("date");
    const date = dateStr ? this.parseDateOnly(dateStr) : new Date();

    if (activityId) {
      return this.attendanceService.createEventForActivity(activityId, date);
    }

    // in the future we may implement a UI to create a one-time event on the fly
    return undefined;
  }

  /**
   * Parse a "YYYY-MM-DD" date string as a local date.
   * (new Date("YYYY-MM-DD") would parse as UTC midnight, shifting the date for negative offsets.)
   */
  private parseDateOnly(value: string): Date {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  private async loadExistingEvent(
    id: string,
  ): Promise<EventWithAttendance | undefined> {
    let event: EventWithAttendance | undefined;
    try {
      const entityType = Entity.extractTypeFromId(id);
      const entity = await this.entityMapper.load(entityType, id);
      event = EventWithAttendance.from(entity);
    } catch (e) {
      Logging.warn("Could not load event " + id, e);
      void this.router.navigate(["/404"]);
      return undefined;
    }
    return event;
  }

  /**
   * Set the index of the first participant that expects user input.
   * This is the first entry of the list, if the user has never recorded attendance
   * for this event. Else it is the first participant without any attendance information
   * (i.e. got skipped or the user left at this participant)
   */
  private setInitialIndex() {
    const participantsList = this.participants();
    const attendanceMap = this.attendanceByParticipant();
    let index = 0;
    for (const entry of participantsList) {
      if (!attendanceMap[entry.getId()]?.status?.id) {
        break;
      }
      index += 1;
    }

    // do not jump to end - if all participants are recorded, start with first instead
    if (index >= participantsList.length) {
      index = 0;
    }

    this.goToParticipantWithIndex(index);
  }

  private loadAttendanceStatusTypes() {
    this.availableStatus.set(
      this.enumService.getEnumValues<AttendanceStatusType>(
        ATTENDANCE_STATUS_CONFIG_ID,
      ),
    );
  }

  private async loadParticipants() {
    if (!this.event()) return;
    const attendanceItems: AttendanceItem[] = this.event().attendanceItems;

    const active: Entity[] = [];
    const inactive: Entity[] = [];
    const attendanceMap: Record<string, AttendanceItem> = {};
    const validAttendanceItems: AttendanceItem[] = [];

    for (const attendanceItem of attendanceItems) {
      const participantId = attendanceItem.participant;
      let participant: Entity;
      try {
        participant = await this.entityMapper.load(
          Entity.extractTypeFromId(participantId),
          participantId,
        );
      } catch (e) {
        Logging.debug(
          "Could not find participant " +
            participantId +
            " for event " +
            this.event().entity.getId(),
        );
        continue;
      }

      validAttendanceItems.push(attendanceItem);
      attendanceMap[participantId] = attendanceItem;

      if (participant.isActive) {
        active.push(participant);
      } else {
        inactive.push(participant);
      }
    }

    this.event().attendanceItems = validAttendanceItems;
    this.participants.set(active);
    this.inactiveParticipants.set(inactive);
    this.attendanceByParticipant.set(attendanceMap);
    this.sortParticipants();
  }

  private sortParticipants() {
    const sortBy = this.sortParticipantsBy();
    if (!sortBy) {
      return;
    }

    this.participants.update((participants) =>
      [...participants].sort(sortByAttribute<any>(sortBy, "asc")),
    );
    // also sort the participants in the entity itself for display in details view later
    const event = this.event();
    if (event) {
      const sortedIds = this.participants().map((e) => e.getId());
      const attendance = event.attendanceItems;
      attendance.sort(
        (a, b) =>
          sortedIds.indexOf(a.participant) - sortedIds.indexOf(b.participant),
      );
      event.attendanceItems = attendance;
    }
  }

  markAttendance(status: AttendanceStatusType) {
    const attendance = this.currentAttendance();
    if (attendance) {
      attendance.status = status;
    }
    this.isDirty.set(true);
    this.unsavedChanges.pending = true;

    this.goToParticipantWithIndex(this.currentIndex() + 1);
  }

  goToParticipantWithIndex(newIndex: number) {
    this.currentIndex.set(
      Math.max(0, Math.min(newIndex, this.participants().length)),
    );

    if (this.isFinished()) {
      void this.saveEvent();
    }
  }

  finish() {
    this.location.back();
  }

  /**
   * Handle navigating back, showing save/discard dialog if there are unsaved changes.
   */
  exit() {
    if (this.isDirty()) {
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
              this.isDirty.set(false);
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
    const entity = this.event()?.entity;
    if (entity) {
      try {
        await this.entityMapper.save(entity);
        this.isDirty.set(false);
        this.unsavedChanges.pending = false;
      } catch (e) {
        Logging.warn("Could not save attendance event", e);
        this.confirmationDialog.getConfirmation(
          $localize`:Error message when saving failed:Error trying to save`,
          $localize`An error occurred while saving the event. Please try again.`,
          OkButton,
        );
      }
    }
  }

  showDetails() {
    this.formDialog.openView(this.event()?.entity);
  }

  async includeInactive() {
    const confirmation = await this.confirmationDialog.getConfirmation(
      $localize`Also include archived participants?`,
      $localize`This event has some participants who are "archived". We automatically remove them from the attendance list for you. Do you want to also include archived participants for this event?`,
    );
    if (confirmation) {
      this.participants.update((p) => [...p, ...this.inactiveParticipants()]);
      this.inactiveParticipants.set([]);
      this.sortParticipants();
    }
  }
}
