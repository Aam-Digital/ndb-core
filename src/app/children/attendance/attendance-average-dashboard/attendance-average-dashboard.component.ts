import { Component, OnInit } from '@angular/core';
import {ChildrenService} from '../../children.service';
import {Database} from '../../../database/database';
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

  constructor(private db: Database,
              private childrenService: ChildrenService,
              private router: Router) { }

  ngOnInit() {
    this.createAttendanceAnalysisIndex()
      .then(() => this.loadAverageAttendances());
  }

  private createAttendanceAnalysisIndex(): Promise<any> {
    const emit = (x, y?) => {}; // defined to avoid Typescript error. Actually `emit` is provided by pouchDB to the `map` function

    const designDoc = {
      _id: '_design/avg_attendance_index',
      views: {
        three_months: {
          map: averageAttendanceMap.toString(),
          reduce: '_stats'
        },
        last_month: {
          map: lastAverageAttendanceMap.toString(),
          reduce: '_stats'
        }
      }
    };

    return this.db.saveDatabaseIndex(designDoc);


    // `emit(x)` to add x as a key to the index that can be searched
    function averageAttendanceMap (doc) {
      if (!doc._id.startsWith('AttendanceMonth:')) {
        return;
      }
      if (!isWithinLast3Months(new Date(doc.month), new Date())) {
        return;
      }

      emit(doc.student, doc.daysAttended / (doc.daysWorking - doc.daysExcused));

      function isWithinLast3Months(date: Date, now: Date) {
        let months;
        months = (now.getFullYear() - date.getFullYear()) * 12;
        months -= date.getMonth();
        months += now.getMonth();

        if (months < 0) {
          return false;
        }
        return months <= 3;
      }
    }

    function lastAverageAttendanceMap (doc) {
      if (!doc._id.startsWith('AttendanceMonth:')) {
        return;
      }
      if (!isWithinLastMonth(new Date(doc.month), new Date())) {
        return;
      }

      emit(doc.student, doc.daysAttended / (doc.daysWorking - doc.daysExcused));

      function isWithinLastMonth(date: Date, now: Date) {
        let months;
        months = (now.getFullYear() - date.getFullYear()) * 12;
        months -= date.getMonth();
        months += now.getMonth();

        return months === 1;
      }
    }
  }


  loadAverageAttendances() {
    const countMap = new Map<string, [Child, number, number]>();
    this.db.query('avg_attendance_index/three_months', {reduce: true, group: true})
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
      .then(() => this.db.query('avg_attendance_index/last_month', {reduce: true, group: true}))
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
