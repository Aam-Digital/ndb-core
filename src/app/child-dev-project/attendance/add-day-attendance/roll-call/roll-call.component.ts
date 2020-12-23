import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { animate, style, transition, trigger } from "@angular/animations";
import {
  AttendanceStatus,
  AttendanceStatusType,
  DEFAULT_ATTENDANCE_TYPES,
} from "../../model/attendance-status";
import { Note } from "../../../notes/model/note";
import { EventAttendance } from "../../model/event-attendance";

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
   * Emitted when the roll call is finished (or aborted).
   *
   * In case it is aborted `undefined` is passed.
   */
  @Output() complete = new EventEmitter<Note>();

  currentIndex: number;

  /** options available for selecting an attendance status */
  availableStatus: AttendanceStatusType[];

  entries: { childId: string; attendance: EventAttendance }[];

  async ngOnInit() {
    this.loadAttendanceStatusTypes();

    this.entries = this.eventEntity.children.map((childId) => ({
      childId: childId,
      attendance: this.eventEntity.getAttendance(childId),
    }));
    this.goToNextStudent(0);
  }

  private loadAttendanceStatusTypes() {
    // TODO: move this into config completely
    this.availableStatus = DEFAULT_ATTENDANCE_TYPES;
  }

  markAttendance(childId: string, status: AttendanceStatus) {
    this.eventEntity.getAttendance(childId).status = status;
    setTimeout(() => this.goToNextStudent(), 750);
  }

  goToNextStudent(newIndex?: number) {
    if (newIndex !== undefined) {
      this.currentIndex = newIndex;
    } else {
      this.currentIndex++;
    }
  }

  abort() {
    this.complete.emit(undefined);
  }
  finish() {
    this.complete.emit(this.eventEntity);
  }

  isFinished(): boolean {
    return this.currentIndex >= this.eventEntity.children.length;
  }
}
