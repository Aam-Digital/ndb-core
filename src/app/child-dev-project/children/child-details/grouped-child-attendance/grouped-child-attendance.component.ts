import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Entity } from "../../../../core/entity/model/entity";
import { AttendanceService } from "../../../attendance/attendance.service";
import { RecurringActivity } from "../../../attendance/model/recurring-activity";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { TabStateModule } from "../../../../utils/tab-state/tab-state.module";
import { ActivityAttendanceSectionComponent } from "../../../attendance/activity-attendance-section/activity-attendance-section.component";
import { MatSelectModule } from "@angular/material/select";

@DynamicComponent("GroupedChildAttendance")
@Component({
  selector: "app-grouped-child-attendance",
  templateUrl: "./grouped-child-attendance.component.html",
  styleUrls: ["./grouped-child-attendance.component.scss"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatProgressBarModule,
    MatTabsModule,
    TabStateModule,
    ActivityAttendanceSectionComponent,
    MatSelectModule,
  ],
})
export class GroupedChildAttendanceComponent implements OnInit {
  @Input() entity: Entity;

  loading: boolean = true;
  selectedActivity: RecurringActivity;
  activities: RecurringActivity[] = [];
  archivedActivities: RecurringActivity[] = [];

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit() {
    return this.loadActivities();
  }

  private async loadActivities() {
    this.loading = true;
    const allActivities = await this.attendanceService.getActivitiesForChild(
      this.entity.getId(),
    );

    this.activities = allActivities.filter(
      (a) =>
        !a.excludedParticipants.includes(this.entity.getId()) &&
        a.isActive == true,
    );

    this.archivedActivities = allActivities.filter(
      (a) =>
        !a.excludedParticipants.includes(this.entity.getId()) &&
        a.isActive == false,
    );

    this.loading = false;
  }

  onActivityChange(selectedArchivedActivity: RecurringActivity) {
    this.selectedActivity = selectedArchivedActivity;
  }
}
