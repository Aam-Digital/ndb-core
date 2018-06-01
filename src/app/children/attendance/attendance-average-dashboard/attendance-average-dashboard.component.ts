import { Component, OnInit } from '@angular/core';
import {ChildrenService} from '../../children.service';
import {Child} from '../../child';
import {Router} from '@angular/router';
import {AttendanceMonth} from '../attendance-month';

@Component({
  selector: 'app-attendance-average-dashboard',
  templateUrl: './attendance-average-dashboard.component.html',
  styleUrls: ['./attendance-average-dashboard.component.scss']
})
export class AttendanceAverageDashboardComponent implements OnInit {
  readonly ATTENDANCE_THRESHOLD = AttendanceMonth.THRESHOLD_WARNING;

  overallAttendance: number;
  lastMonthsTopAttendence = []; // [[Child, average_last_3_months, last_months_attendance]]

  constructor(private childrenService: ChildrenService,
              private router: Router) { }

  ngOnInit() {
    this.loadAverageAttendances();
  }



  loadAverageAttendances() {
    const countMap = new Map<string, [Child, number, number]>();
    this.childrenService.queryAttendanceLast3Months()
      .then(queryResults => {
        let totalCount = 0;
        let summedAverage = 0;
        queryResults.rows.forEach(studentStat => {
          totalCount += studentStat.value.count;
          summedAverage += studentStat.value.sum;

          countMap.set(studentStat.key, [undefined, studentStat.value.sum / studentStat.value.count, 0]);
        });

        this.overallAttendance = summedAverage / totalCount;
      })
      .then(() => this.childrenService.queryAttendanceLastMonth())
      .then(queryResults => {
        queryResults.rows.forEach(studentStat => {
          const record = countMap.get(studentStat.key);
          record[2] = studentStat.value.sum / studentStat.value.count;

          if (record[2] >= this.ATTENDANCE_THRESHOLD) {
            this.childrenService.getChild(studentStat.key)
              .subscribe(child => record[0] = child);
          } else {
            countMap.delete(studentStat.key);
          }
        });

        this.lastMonthsTopAttendence = Array.from(countMap.values()); // direct use of Map creates change detection problems
      });
  }


  goToChild(childId: string) {
    this.router.navigate(['/child', childId]);
  }
}
