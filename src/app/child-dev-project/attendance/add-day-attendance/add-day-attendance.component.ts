import { Component, OnInit } from "@angular/core";
import { Child } from "../../children/model/child";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Note } from "../../notes/model/note";
import { ChildrenService } from "../../children/children.service";

@Component({
  selector: "app-add-day-attendance",
  templateUrl: "./add-day-attendance.component.html",
  styleUrls: ["./add-day-attendance.component.scss"],
})
export class AddDayAttendanceComponent implements OnInit {
  currentStage = 0;

  day = new Date();
  attendanceType: string;

  selectedChildren: Child[] = [];
  event: Note;

  allChildren: Child[] = [];

  stages = ["Select Event", "Record Attendance"];

  constructor(
    private entityService: EntityMapperService,
    private childrenService: ChildrenService
  ) {}

  ngOnInit(): void {
    this.childrenService
      .getChildren()
      .subscribe((children) => (this.allChildren = children));
  }

  async finishBasicInformationStage(event: Note) {
    this.event = event;

    this.selectedChildren = this.allChildren.filter((c) =>
      event.children.includes(c.getId())
    );

    this.currentStage = 1;
  }

  async finishRollCallState() {
    await this.entityService.save(this.event);
    this.currentStage = 0;
  }
}
