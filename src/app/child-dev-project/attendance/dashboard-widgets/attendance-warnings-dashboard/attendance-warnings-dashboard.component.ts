import { Component, OnInit } from "@angular/core";
import { ChildrenService } from "../../../children/children.service";
import { Router } from "@angular/router";
import { AttendanceMonth } from "../../model/attendance-month";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { Child } from "../../../children/model/child";

@UntilDestroy()
@Component({
  selector: "app-attendance-warnings-dashboard",
  templateUrl: "./attendance-warnings-dashboard.component.html",
  styleUrls: ["./attendance-warnings-dashboard.component.scss"],
})
export class AttendanceWarningsDashboardComponent
  implements OnInitDynamicComponent, OnInit {
  readonly ATTENDANCE_THRESHOLD = AttendanceMonth.THRESHOLD_WARNING;

  lastMonthsLowAttendence = []; // [[Child, last_months_attendance]]

  constructor(
    private childrenService: ChildrenService,
    private router: Router
  ) {}

  onInitFromDynamicConfig(config: any) {}

  async ngOnInit() {
    await this.loadLastAttendances();
  }

  async loadLastAttendances() {
    await this.childrenService
      .queryAttendanceLastMonth()
      .then((queryResults) => {
        this.lastMonthsLowAttendence = [];
        queryResults.rows.forEach((studentStat) => {
          const att = studentStat.value.sum / studentStat.value.count;

          let urgency = "WARNING";
          if (att < AttendanceMonth.THRESHOLD_URGENT) {
            urgency = "URGENT";
          }

          if (att < this.ATTENDANCE_THRESHOLD) {
            this.childrenService
              .getChild(studentStat.key)
              .pipe(untilDestroyed(this))
              .subscribe((child) =>
                this.lastMonthsLowAttendence.push([child, att, urgency])
              );
          }
        });
        this.lastMonthsLowAttendence.sort((a, b) => a[1] - b[1]);
      });
  }

  goToChild(childId: string) {
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, childId]);
  }
}
