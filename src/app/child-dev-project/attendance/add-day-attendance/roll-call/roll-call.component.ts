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

  entries: { childId: string; attendance: EventAttendance }[];

  constructor(private configService: ConfigService) {}

  async ngOnInit() {
    this.loadAttendanceStatusTypes();

    this.entries = this.eventEntity.children.map((childId) => ({
      childId: childId,
      attendance: this.eventEntity.getAttendance(childId),
    }));
    this.goToNextParticipant(0);
  }

  private loadAttendanceStatusTypes() {
    this.availableStatus = this.configService.getConfig<
      ConfigurableEnumConfig<AttendanceStatusType>
    >(ATTENDANCE_STATUS_CONFIG_ID);
  }

  markAttendance(childId: string, status: AttendanceStatusType) {
    this.eventEntity.getAttendance(childId).status = status;

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
    return this.currentIndex >= this.eventEntity.children.length;
  }
}
