import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../core/entity/model/entity";
import { ActivityAttendance } from "../model/activity-attendance";
import { AttendanceService } from "../attendance.service";
import moment from "moment";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import {
  ScreenSize,
  ScreenWidthObserver,
} from "../../../utils/media/screen-size-observer.service";
import { NgForOf, SlicePipe } from "@angular/common";
import { AttendanceBlockComponent } from "../attendance-block/attendance-block.component";

/**
 * This component lists attendance blocks for a child for recent months filtered by institutions.
 * The child object the institution needs to be provided.
 * It also implements a flexible layout to display less attendance blocks on a smaller layout.
 */
@UntilDestroy()
@DynamicComponent("RecentAttendanceBlocks")
@Component({
  selector: "app-recent-attendance-blocks",
  template: `
    <app-attendance-block
      *ngFor="let att of attendanceList | slice: 0 : maxAttendanceBlocks"
      [attendanceData]="att"
      [forChild]="entity.getId()"
    ></app-attendance-block>
  `,
  imports: [NgForOf, SlicePipe, AttendanceBlockComponent],
  standalone: true,
})
export class RecentAttendanceBlocksComponent implements OnInit {
  attendanceList: ActivityAttendance[] = [];
  maxAttendanceBlocks: number = 3;

  @Input() entity: Entity;
  @Input() config: { filterByActivityType: string };

  constructor(
    private attendanceService: AttendanceService,
    private screenWidthObserver: ScreenWidthObserver,
  ) {
    this.screenWidthObserver
      .shared()
      .pipe(untilDestroyed(this))
      .subscribe((change) => {
        switch (change) {
          case ScreenSize.xs:
          case ScreenSize.sm: {
            this.maxAttendanceBlocks = 1;
            break;
          }
          case ScreenSize.md: {
            this.maxAttendanceBlocks = 2;
            break;
          }
          case ScreenSize.lg: {
            this.maxAttendanceBlocks = 3;
            break;
          }
          case ScreenSize.xl:
          case ScreenSize.xxl: {
            this.maxAttendanceBlocks = 6;
            break;
          }
        }
      });
  }

  async ngOnInit() {
    let activities = await this.attendanceService.getActivitiesForChild(
      this.entity.getId(),
    );
    if (this.config.filterByActivityType) {
      activities = activities.filter(
        (a) => a.type.id === this.config.filterByActivityType,
      );
    }

    this.attendanceList = [];
    const activityRecords =
      await this.attendanceService.getAllActivityAttendancesForPeriod(
        moment().startOf("month").toDate(),
        moment().endOf("month").toDate(),
      );

    for (const record of activityRecords) {
      if (activities.find((a) => a.getId() === record.activity?.getId())) {
        this.attendanceList.push(record);
      }
    }
  }
}
