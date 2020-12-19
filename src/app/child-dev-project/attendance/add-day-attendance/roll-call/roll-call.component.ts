import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Child } from "../../../children/model/child";
import { animate, style, transition, trigger } from "@angular/animations";
import {
  AttendanceStatus,
  AttendanceStatusType,
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
   * A list of Child objects including the ones referenced in the given eventEntity.
   *
   * This is required to display details like child's name.
   * The array is treated as a utility data source and children included here are *not* automatically added to the event.
   */
  @Input() children: Child[];

  /**
   * Emitted when the roll call is finished (or aborted).
   *
   * In case it is aborted `undefined` is passed.
   */
  @Output() complete = new EventEmitter<Note>();

  currentIndex: number;

  /** options available for selecting an attendance status */
  availableStatus: AttendanceStatusType[];

  entries: { child: Child; attendance: EventAttendance }[];

  async ngOnInit() {
    this.loadAttendanceStatusTypes();

    this.entries = this.eventEntity.children.map((childId) => ({
      child: this.children.find((c) => c.getId() === childId),
      attendance: this.eventEntity.getAttendance(childId),
    }));
    this.goToNextStudent(0);
  }

  private loadAttendanceStatusTypes() {
    // TODO: move this into config completely
    this.availableStatus = [
      {
        status: AttendanceStatus.PRESENT,
        shortName: "P",
        name: "Present",
        color: "#C8E6C9",
      },
      {
        status: AttendanceStatus.ABSENT,
        shortName: "A",
        name: "Absent",
        color: "#FF8A65",
      },
      {
        status: AttendanceStatus.LATE,
        shortName: "L",
        name: "Late",
        color: "#FFECB3",
      },
      {
        status: AttendanceStatus.HOLIDAY,
        shortName: "H",
        name: "Holiday",
        color: "#CFD8DC",
      },
      {
        status: AttendanceStatus.EXCUSED,
        shortName: "E",
        name: "Excused",
        color: "#D7CCC8",
      },
      {
        status: AttendanceStatus.UNKNOWN,
        shortName: "?",
        name: "Skip",
        color: "#DDDDDD",
      },
    ];
  }

  markAttendance(child: Child, status: AttendanceStatus) {
    this.eventEntity.getAttendance(child.getId()).status = status;
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
