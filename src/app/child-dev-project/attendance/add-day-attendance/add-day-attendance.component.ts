import { Component } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Note } from "../../notes/model/note";

@Component({
  selector: "app-add-day-attendance",
  templateUrl: "./add-day-attendance.component.html",
  styleUrls: ["./add-day-attendance.component.scss"],
})
export class AddDayAttendanceComponent {
  currentStage = 0;

  day = new Date();
  attendanceType: string;

  event: Note;

  stages = ["Select Event", "Record Attendance"];

  constructor(private entityMapper: EntityMapperService) {}

  finishBasicInformationStage(event: Note) {
    this.event = event;
    this.currentStage = 1;
  }

  async finishRollCallState() {
    await this.entityMapper.save(this.event);
    this.currentStage = 0;
  }
}
