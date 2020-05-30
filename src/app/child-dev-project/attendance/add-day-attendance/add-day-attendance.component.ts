import { Component } from "@angular/core";
import { Child } from "../../children/model/child";

@Component({
  selector: "app-add-day-attendance",
  templateUrl: "./add-day-attendance.component.html",
  styleUrls: ["./add-day-attendance.component.scss"],
})
export class AddDayAttendanceComponent {
  currentStage = 0;

  day = new Date();
  attendanceType: string;
  students: Child[] = [];

  stages = ["Setup Roll Call", "Select Student Group", "Roll Call"];

  constructor() {}

  finishBasicInformationStage() {
    this.currentStage = 1;
  }

  finishStudentSelectionStage(selectedStudents: Child[]) {
    this.students = selectedStudents;

    this.currentStage = 2;
  }

  finishRollCallState() {
    this.currentStage = 0;
  }
}
