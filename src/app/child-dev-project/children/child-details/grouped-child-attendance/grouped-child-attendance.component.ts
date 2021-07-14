import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Child } from "../../model/child";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../../core/entity-components/entity-details/EntityDetailsConfig";
import { AttendanceService } from "../../../attendance/attendance.service";
import { RecurringActivity } from "../../../attendance/model/recurring-activity";

@Component({
  selector: "app-grouped-child-attendance",
  templateUrl: "./grouped-child-attendance.component.html",
  styleUrls: ["./grouped-child-attendance.component.scss"],
})
export class GroupedChildAttendanceComponent
  implements OnChanges, OnInitDynamicComponent
{
  @Input() child: Child = new Child("");

  activities: RecurringActivity[] = [];

  constructor(private attendanceService: AttendanceService) {}

  async ngOnChanges(changes: SimpleChanges) {
    await this.loadActivities();
  }

  async onInitFromDynamicConfig(config: PanelConfig) {
    this.child = config.entity as Child;
    await this.loadActivities();
  }

  private async loadActivities() {
    this.activities = await this.attendanceService.getActivitiesForChild(
      this.child.getId()
    );
  }
}
