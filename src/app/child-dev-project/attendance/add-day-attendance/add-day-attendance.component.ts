import { Component } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Note } from "../../notes/model/note";
import { ActivatedRoute } from "@angular/router";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";

/**
 * additional config specifically for AddDayAttendanceComponent
 */
export interface AddDayAttendanceConfig {
  /** (optional) property name of the participant entities by which they are sorted for the roll call */
  sortParticipantsBy?: string;
}

@Component({
  selector: "app-add-day-attendance",
  templateUrl: "./add-day-attendance.component.html",
  styleUrls: ["./add-day-attendance.component.scss"],
})
export class AddDayAttendanceComponent {
  config?: AddDayAttendanceConfig;

  currentStage = 0;

  day = new Date();
  attendanceType: string;

  event: Note;

  stages = [
    $localize`:One of the stages while recording child-attendances:Select Event`,
    $localize`:One of the stages while recording child-attendances:Record Attendance`,
  ];

  constructor(
    private entityMapper: EntityMapperService,
    private route: ActivatedRoute
  ) {
    this.route.data.subscribe((data: RouteData<AddDayAttendanceConfig>) => {
      this.config = data.config;
    });
  }

  finishBasicInformationStage(event: Note) {
    this.event = event;
    this.currentStage = 1;
  }

  finishRollCallState() {
    this.currentStage = 0;
  }

  async saveRollCallResult(eventNote: Note) {
    await this.entityMapper.save(eventNote);
  }
}
