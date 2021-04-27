import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { animate, style, transition, trigger } from "@angular/animations";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceStatusType,
} from "../../model/attendance-status";
import { Note } from "../../../notes/model/note";
import { EventAttendance } from "../../model/event-attendance";
import { ConfigService } from "../../../../core/config/config.service";
import { ConfigurableEnumConfig } from "../../../../core/configurable-enum/configurable-enum.interface";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../../children/model/child";
import { LoggingService } from "../../../../core/logging/logging.service";

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
        style({ backgroundColor: "white" }),
        animate(1000),
      ]),
    ]),
  ],
})
export class RollCallComponent implements OnInit {
  /**
   * The event to be displayed and edited.
   */
  @Input() eventEntity: Note;

  /**
   * Emitted when the roll call is finished and results can be saved.
   */
  @Output() complete = new EventEmitter<Note>();

  /**
   * Emitted when the user wants to dismiss & leave the roll call view.
   */
  @Output() exit = new EventEmitter();

  currentIndex: number;

  /** options available for selecting an attendance status */
  availableStatus: AttendanceStatusType[];

  entries: { child: Child; attendance: EventAttendance }[];

  constructor(
    private configService: ConfigService,
    private entityMapper: EntityMapperService,
    private loggingService: LoggingService
  ) {}

  async ngOnInit() {
    this.entries = [];
    this.loadAttendanceStatusTypes();
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
        continue;
      }
      this.entries.push({
        child: child,
        attendance: this.eventEntity.getAttendance(childId),
      });
    }
    this.goToNextParticipant(0);
  }

  private loadAttendanceStatusTypes() {
    this.availableStatus = this.configService.getConfig<
      ConfigurableEnumConfig<AttendanceStatusType>
    >(ATTENDANCE_STATUS_CONFIG_ID);
  }

  markAttendance(attendance: EventAttendance, status: AttendanceStatusType) {
    attendance.status = status;

    // automatically move to next participant after a short delay giving the user visual feedback on the selected status
    setTimeout(() => this.goToNextParticipant(), 750);
  }

  goToNextParticipant(newIndex?: number) {
    if (newIndex !== undefined) {
      this.currentIndex = newIndex;
    } else {
      this.currentIndex++;
    }

    if (this.isFinished()) {
      this.complete.emit(this.eventEntity);
    }
  }

  isFinished(): boolean {
    return this.currentIndex >= this.entries?.length;
  }
}
