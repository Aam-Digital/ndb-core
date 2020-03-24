import { Component, OnInit } from '@angular/core';
import { ChildrenService } from '../../../children/children.service';
import { Router } from '@angular/router';
import { AttendanceMonth } from '../../model/attendance-month';

@Component({
  selector: 'app-attendance-warnings-dashboard',
  templateUrl: './attendance-warnings-dashboard.component.html',
  styleUrls: ['./attendance-warnings-dashboard.component.scss'],
})
export class AttendanceWarningsDashboardComponent implements OnInit {
  readonly ATTENDANCE_THRESHOLD = AttendanceMonth.THRESHOLD_WARNING;


  lastMonthsLowAttendence = []; // [[Child, last_months_attendance]]

  constructor(private childrenService: ChildrenService,
              private router: Router) { }

  async ngOnInit() {
    await this.loadLastAttendances();
  }



  async loadLastAttendances() {
    await this.childrenService.queryAttendanceLastMonth()
      .then(queryResults => {
        this.lastMonthsLowAttendence = [];
        queryResults.rows.forEach(studentStat => {
          const att = studentStat.value.sum / studentStat.value.count;

          let urgency = 'WARNING';
          if (att < AttendanceMonth.THRESHOLD_URGENT) {
            urgency = 'URGENT';
          }

          if (att < this.ATTENDANCE_THRESHOLD) {
            this.childrenService.getChild(studentStat.key)
              .subscribe(child => this.lastMonthsLowAttendence.push([child, att, urgency]));
          }
        });
        this.lastMonthsLowAttendence.sort((a, b) => a[1] - b[1]);
      });
  }


  goToChild(childId: string) {
    this.router.navigate(['/child', childId]);
  }
}
