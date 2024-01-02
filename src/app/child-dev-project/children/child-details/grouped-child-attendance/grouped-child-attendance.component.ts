import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Child } from "../../model/child";
import { AttendanceService } from "../../../attendance/attendance.service";
import { RecurringActivity } from "../../../attendance/model/recurring-activity";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { NgForOf, NgIf } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { TabStateModule } from "../../../../utils/tab-state/tab-state.module";
import { ActivityAttendanceSectionComponent } from "../../../attendance/activity-attendance-section/activity-attendance-section.component";

@DynamicComponent("GroupedChildAttendance")
@Component({
  selector: "app-grouped-child-attendance",
  templateUrl: "./grouped-child-attendance.component.html",
  styleUrls: ["./grouped-child-attendance.component.scss"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgIf,
    MatProgressBarModule,
    MatTabsModule,
    TabStateModule,
    ActivityAttendanceSectionComponent,
    NgForOf,
  ],
  standalone: true,
})
export class GroupedChildAttendanceComponent implements OnInit {
  @Input() entity: Child = new Child("");

  loading: boolean = true;
  activities: RecurringActivity[] = [];

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit() {
    return this.loadActivities();
  }

  private async loadActivities() {
    this.loading = true;
    this.activities = (
      await this.attendanceService.getActivitiesForChild(
        this.entity.getId(true),
      )
    ).filter((a) => !a.excludedParticipants.includes(this.entity.getId(true)));
    this.loading = false;
  }
}
