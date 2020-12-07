import { Component } from "@angular/core";
import { Child } from "../../children/model/child";
import { EventNote } from "../model/event-note";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

@Component({
  selector: "app-add-day-attendance",
  templateUrl: "./add-day-attendance.component.html",
  styleUrls: ["./add-day-attendance.component.scss"],
})
export class AddDayAttendanceComponent {
  currentStage = 0;

  day = new Date();
  attendanceType: string;
  selectedChildren: Child[] = [];
  event: EventNote;

  stages = ["Setup Roll Call", "Select Student Group", "Roll Call"];

  constructor(private entityService: EntityMapperService) {}

  finishBasicInformationStage() {
    this.currentStage = 1;
  }

  finishStudentSelectionStage(selectedStudents: Child[]) {
    this.selectedChildren = selectedStudents;

    this.event = EventNote.create(this.day, this.attendanceType);
    this.event.addChildren(
      selectedStudents.sort(sortByChildClass).map((c) => c.getId())
    );

    this.currentStage = 2;
  }

  async finishRollCallState() {
    await this.entityService.save(this.event);
    this.currentStage = 0;
  }
}

function sortByChildClass(a: Child, b: Child) {
  {
    if (a.schoolClass === b.schoolClass) {
      return 0;
    }

    const diff = parseInt(a.schoolClass, 10) - parseInt(b.schoolClass, 10);
    if (!Number.isNaN(diff)) {
      return diff;
    }

    if (a.schoolClass < b.schoolClass || b.schoolClass === undefined) {
      return -1;
    }
    return 1;
  }
}
