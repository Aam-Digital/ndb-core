import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { Entity } from "#src/app/core/entity/model/entity";
import { AttendanceService } from "../../attendance.service";
import { RecurringActivity } from "../../model/recurring-activity";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { TabStateModule } from "#src/app/utils/tab-state/tab-state.module";
import { ActivityAttendanceSectionComponent } from "../activity-attendance-section/activity-attendance-section.component";
import { MatSelectModule } from "@angular/material/select";

/**
 * Lists all activities of the given child
 * and displays a tab with detailed analysis for each.
 */
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
  private attendanceService = inject(AttendanceService);

  @Input() entity: Entity;

  loading: boolean = true;
  selectedActivity: RecurringActivity;
  activities: RecurringActivity[] = [];
  archivedActivities: RecurringActivity[] = [];

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
