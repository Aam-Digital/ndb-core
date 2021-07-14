import { Component } from "@angular/core";
import { Child } from "../../model/child";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ViewPropertyConfig } from "../../../../core/entity-components/entity-list/EntityListConfig";
import { ActivityAttendance } from "../../../attendance/model/activity-attendance";
import { AttendanceService } from "../../../attendance/attendance.service";
import moment from "moment";

/**
 * This component lists attendance blocks for a child for recent months filtered by institutions.
 * The child object the institution needs to be provided.
 * It also implements a flexible layout to display less attendance blocks on a smaller layout.
 */
@Component({
  selector: "app-recent-attendance-blocks",
  template: `
    <app-attendance-block
      *ngFor="let att of attendanceList | slice: 0:maxAttendanceBlocks"
      [attendanceData]="att"
      [forChild]="child.getId()"
    ></app-attendance-block>
  `,
})
export class RecentAttendanceBlocksComponent implements OnInitDynamicComponent {
  attendanceList: ActivityAttendance[] = [];
  maxAttendanceBlocks: number = 3;

  filterByActivityType: string;
  child: Child;

  constructor(
    private attendanceService: AttendanceService,
    private media: MediaObserver
  ) {
    this.media.asObservable().subscribe((change: MediaChange[]) => {
      switch (change[0].mqAlias) {
        case "xs":
        case "sm": {
          this.maxAttendanceBlocks = 1;
          break;
        }
        case "md": {
          this.maxAttendanceBlocks = 2;
          break;
        }
        case "lg": {
          this.maxAttendanceBlocks = 3;
          break;
        }
        case "xl": {
          this.maxAttendanceBlocks = 6;
          break;
        }
      }
    });
  }

  async onInitFromDynamicConfig(config: ViewPropertyConfig) {
    this.filterByActivityType = config.config.filterByActivityType;

    if (config.hasOwnProperty("entity")) {
      this.child = config.entity as Child;

      let activities = await this.attendanceService.getActivitiesForChild(
        this.child.getId()
      );
      if (this.filterByActivityType) {
        activities = activities.filter(
          (a) => a.type.id === this.filterByActivityType
        );
      }

      this.attendanceList = [];
      const activityRecords =
        await this.attendanceService.getAllActivityAttendancesForPeriod(
          moment().startOf("month").toDate(),
          moment().endOf("month").toDate()
        );

      for (const record of activityRecords) {
        if (activities.find((a) => a.getId() === record.activity?.getId())) {
          this.attendanceList.push(record);
        }
      }
    }
  }
}
