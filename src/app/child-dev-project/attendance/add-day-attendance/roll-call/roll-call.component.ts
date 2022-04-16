import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
} from "../../model/attendance-status";
import { Note } from "../../../notes/model/note";
import { EventAttendance } from "../../model/event-attendance";
import { ConfigService } from "../../../../core/config/config.service";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../../children/model/child";
import { LoggingService } from "../../../../core/logging/logging.service";
import { FormGroup } from "@angular/forms";
import { sortByAttribute } from "../../../../utils/utils";
import { MatTabGroup } from "@angular/material/tabs";

/**
 * Displays the participants of the given event one by one to mark attendance status.
 */
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
    trigger("translateTab", [
      // Transitions to `none` instead of 0, because some browsers might blur the content.
      state(
        "center, void, left-origin-center, right-origin-center",
        style({ transform: "none" })
      ),

      // If the tab is either on the left or right, we additionally add a `min-height` of 1px
      // in order to ensure that the element has a height before its state changes. This is
      // necessary because Chrome does seem to skip the transition in RTL mode if the element does
      // not have a static height and is not rendered. See related issue: #9465
      state(
        "left",
        style({
          transform: "translate3d(-100%, 0, 0)",
          minHeight: "1px",

          // Normally this is redundant since we detach the content from the DOM, but if the user
          // opted into keeping the content in the DOM, we have to hide it, so it isn't focusable.
          visibility: "hidden",
        })
      ),
      state(
        "right",
        style({
          transform: "translate3d(100%, 0, 0)",
          minHeight: "1px",
          visibility: "hidden",
        })
      ),

      transition(
        "* => left, * => right, left => center, right => center",
        animate("{{animationDuration}} cubic-bezier(0.35, 0, 0.25, 1)")
      ),
      transition("void => left-origin-center", [
        style({ transform: "translate3d(-100%, 0, 0)", visibility: "hidden" }),
        animate("{{animationDuration}} cubic-bezier(0.35, 0, 0.25, 1)"),
      ]),
      transition("void => right-origin-center", [
        style({ transform: "translate3d(100%, 0, 0)", visibility: "hidden" }),
        animate("{{animationDuration}} cubic-bezier(0.35, 0, 0.25, 1)"),
      ]),
    ]),
  ],
})
export class RollCallComponent implements OnChanges {
  @ViewChild("tabGroup") tabGroup: MatTabGroup;
  /**
   * The event to be displayed and edited.
   */
  @Input() eventEntity: Note;

  /**
   * (optional) property name of the participant entities by which they are sorted
   */
  @Input() sortParticipantsBy?: string;

  /**
   * Emitted when the roll call is finished and results can be saved.
   */
  @Output() complete = new EventEmitter<Note>();

  /**
   * Emitted when the user wants to dismiss & leave the roll call view.
   */
  @Output() exit = new EventEmitter();

  /**
   * private model; should only be set within this component
   */
  public _currentIndex: number;
  /**
   * whether any changes have been made to the model
   */
  isDirty: boolean = false;
  /**
   * The index of the child that is currently being processed
   */
  get currentIndex(): number {
    return this._currentIndex;
  }
  get currentStatus(): AttendanceStatusType {
    return this.entries[this.currentIndex].attendance.status;
  }
  set currentStatus(newStatus: AttendanceStatusType) {
    this.entries[this.currentIndex].attendance.status = newStatus;
  }
  get currentChild(): Child {
    return this.entries[this.currentIndex].child;
  }

  /** options available for selecting an attendance status */
  availableStatus: AttendanceStatusType[];

  entries: { child: Child; attendance: EventAttendance }[] = [];
  form: FormGroup;

  constructor(
    private configService: ConfigService,
    private entityMapper: EntityMapperService,
    private loggingService: LoggingService
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.eventEntity) {
      this.loadAttendanceStatusTypes();
      await this.loadParticipants();
      this.setInitialIndex();
    }
    if (changes.sortParticipantsBy) {
      this.sortParticipants();
    }
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
    for (const entry of this.entries) {
      if (!this.eventEntity.getAttendance(entry.child.getId())?.status?.id) {
        break;
      }
      index += 1;
    }

    // do not jump to end - if all participants are recorded, start with first instead
    if (index >= this.entries.length) {
      index = 0;
    }

    this._currentIndex = index;
  }

  private loadAttendanceStatusTypes() {
    this.availableStatus = this.configService.getConfigurableEnumValues<AttendanceStatusType>(
      ATTENDANCE_STATUS_CONFIG_ID
    );
  }

  private async loadParticipants() {
    this.entries = [];
    this._currentIndex = 0;
    for (const childId of this.eventEntity.children) {
      let child;
      try {
        child = await this.entityMapper.load(Child, childId);
      } catch (e) {
        this.loggingService.warn(
          "Could not find child " +
            childId +
            " for event " +
            this.eventEntity.getId()
        );
        this.eventEntity.removeChild(childId);
        continue;
      }
      this.entries.push({
        child: child,
        attendance: this.eventEntity.getAttendance(childId),
      });
    }
    this.sortParticipants();
  }

  private sortParticipants() {
    if (!this.sortParticipantsBy) {
      return;
    }

    this.entries.sort((a, b) =>
      sortByAttribute<any>(this.sortParticipantsBy, "asc")(a.child, b.child)
    );
    // also sort the participants in the Note entity itself for display in details view later
    this.eventEntity.children = this.entries.map((e) => e.child.getId());
  }

  markAttendance(status: AttendanceStatusType) {
    this.currentStatus = status;
    this.isDirty = true;

    // automatically move to next participant after a short delay giving the user visual feedback on the selected status
    this.goToNext();
  }

  goToParticipantWithIndex(newIndex: number) {
    this._currentIndex = newIndex;

    if (this.isFinished) {
      this.complete.emit(this.eventEntity);
    }
    this.tabGroup.selectedIndex = newIndex;
  }

  goToPrevious() {
    this.goToParticipantWithIndex(this.currentIndex - 1);
  }

  goToNext() {
    this.goToParticipantWithIndex(this.currentIndex + 1);
  }

  get isFirst(): boolean {
    return this.currentIndex === 0;
  }

  get isLast(): boolean {
    return this.currentIndex === this.entries.length - 1;
  }

  get isFinished(): boolean {
    return this.currentIndex >= this.entries.length;
  }

  finish() {
    this.exit.emit();
  }
}
