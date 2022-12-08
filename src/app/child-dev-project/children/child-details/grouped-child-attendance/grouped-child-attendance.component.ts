import { Component, Input, OnChanges } from "@angular/core";
import { Child } from "../../model/child";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../../core/entity-components/entity-details/EntityDetailsConfig";
import { AttendanceService } from "../../../attendance/attendance.service";
import { RecurringActivity } from "../../../attendance/model/recurring-activity";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("GroupedChildAttendance")
@Component({
  selector: "app-grouped-child-attendance",
  templateUrl: "./grouped-child-attendance.component.html",
})
export class GroupedChildAttendanceComponent
  implements OnChanges, OnInitDynamicComponent
{
  @Input() child: Child = new Child("");

  loading: boolean = true;
  activities: RecurringActivity[] = [];

  constructor(private attendanceService: AttendanceService) {}

  async ngOnChanges() {
    await this.loadActivities();
  }

  async onInitFromDynamicConfig(config: PanelConfig) {
    this.child = config.entity as Child;
    await this.loadActivities();
  }

  private async loadActivities() {
    this.loading = true;
    this.activities = await this.attendanceService.getActivitiesForChild(
      this.child.getId()
    );
    this.loading = false;
  }
}
