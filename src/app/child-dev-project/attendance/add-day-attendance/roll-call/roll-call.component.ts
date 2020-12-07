import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Child } from "../../../children/model/child";
import { animate, style, transition, trigger } from "@angular/animations";
import { AttendanceStatus } from "../../model/attendance-status";
import { EventNote } from "../../model/event-note";

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
  @Input() eventEntity: EventNote;

  /**
   * A list of Child objects including the ones referenced in the given eventEntity.
   *
   * This is required to display details like child's name.
   * The array is treated as a utility data source and children included here are *not* automatically added to the event.
   */
  @Input() children: Child[];

  /**
   * Emitted when the roll call is finished (or aborted).
   */
  @Output() complete = new EventEmitter<EventNote>();

  currentIndex: number;

  /** mapped enum to be accessible in template */
  AttStatus = AttendanceStatus;

  async ngOnInit() {
    this.goToNextStudent(0);
  }

  markAttendance(status: AttendanceStatus) {
    this.eventEntity.children[this.currentIndex].status = status;
    setTimeout(() => this.goToNextStudent(), 750);
  }

  goToNextStudent(newIndex?: number) {
    if (newIndex !== undefined) {
      this.currentIndex = newIndex;
    } else {
      this.currentIndex++;
    }
  }

  endRollCall() {
    this.complete.emit(this.eventEntity);
  }

  isFinished(): boolean {
    return this.currentIndex >= this.eventEntity.children.length;
  }

  getChildById(childId: string) {
    return this.children.find((c) => c.getId() === childId);
  }
}
