import { Component, OnInit } from "@angular/core";
import { ChildrenService } from "../../../children/children.service";
import { Child } from "../../../children/model/child";
import { Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DashboardWidgetComponent } from "app/child-dev-project/dashboard/dashboard-widget.component";

@UntilDestroy()
@Component({
  selector: "app-attendance-average-dashboard",
  templateUrl: "./attendance-average-dashboard.component.html",
  styleUrls: ["./attendance-average-dashboard.component.scss"],
})
export class AttendanceAverageDashboardComponent
  implements DashboardWidgetComponent, OnInit {
  readonly ATTENDANCE_THRESHOLD = 0.9;

  overallAttendance: number;
  lastMonthsTopAttendence = []; // [[Child, average_last_3_months, last_months_attendance]]

  constructor(
    private childrenService: ChildrenService,
    private router: Router
  ) {}

  initFromConfig(config: any) {}

  async ngOnInit() {
    await this.loadAverageAttendances();
  }

  async loadAverageAttendances() {
    const countMap = new Map<string, [Child, number, number]>();

    const attendance3Months = await this.childrenService.queryAttendanceLast3Months();
    let totalCount = 0;
    let summedAverage = 0;
    attendance3Months.rows.forEach((studentStat) => {
      totalCount += studentStat.value.count;
      summedAverage += studentStat.value.sum;

      countMap.set(studentStat.key, [
        undefined,
        studentStat.value.sum / studentStat.value.count,
        0,
      ]);
    });

    this.overallAttendance = summedAverage / totalCount;

    const attendanceLastMonth = await this.childrenService.queryAttendanceLastMonth();
    attendanceLastMonth.rows.forEach((studentStat) => {
      const record = countMap.get(studentStat.key);
      record[2] = studentStat.value.sum / studentStat.value.count;

      if (record[2] >= this.ATTENDANCE_THRESHOLD) {
        this.childrenService
          .getChild(studentStat.key)
          .pipe(untilDestroyed(this))
          .subscribe((child) => (record[0] = child));
      } else {
        countMap.delete(studentStat.key);
      }
    });

    // remove elements that don't have a matching attendance from last month
    countMap.forEach((v, k) => {
      if (v[2] === 0) {
        countMap.delete(k);
      }
    });

    this.lastMonthsTopAttendence = Array.from(countMap.values()); // direct use of Map creates change detection problems
  }

  goToChild(childId: string) {
    this.router.navigate(["/child", childId]);
  }
}
