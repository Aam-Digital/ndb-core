import { Component, Input, OnInit } from '@angular/core';
import { ChildrenService } from '../../../children/children.service';
import { Router } from '@angular/router';
import { AttendanceMonth } from '../../model/attendance-month';
import { AttendanceDay, AttendanceStatus } from '../../model/attendance-day';
import { Child } from '../../../children/model/child';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-recent-notes-dashboard',
  templateUrl: './recent-notes-dashboard.component.html',
  styleUrls: ['./recent-notes-dashboard.component.scss'],
})
export class RecentNotesDashboardComponent implements OnInit {

  @Input() daysOffset: number;
  @Input() periodLabel: string;

  attendanceRecordsMap: Map<string,
    { childId: string, child: Child, attendanceSchool: AttendanceDay[], attendanceCoaching: AttendanceDay[],
      schoolAbsences?: number, coachingAbsences?: number}>;
  attendanceRecords;
  concernedChildren: Child[] = [];


  constructor(private childrenService: ChildrenService,
              private router: Router) { }

  async ngOnInit() {
    // this.loadAttendanceOfAbsentees(this.daysOffset);
    await this.loadConcernedChildren();
    // console.log(this.concernedChildren);
  }

  recordTrackByFunction = (index, item) => item.childId;

  async loadConcernedChildren() {
    await this.childrenService.getChildren()
      .subscribe(children => {
        // this.concernedChildren = children;
        children.forEach(child => {
          this.childrenService.getNotesOfChild(child.getId())
            .subscribe(notes => {
              notes.sort((a, b) => {
                return (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0);
              });
             // console.log(notes[0].date);
             // console.log();
              if (this.dateDiffInDays(notes[0].date, new Date()) <= 7 ) {
                // this.concernedChildren.push(child);
                this.concernedChildren.push(child);
                console.log(child.name + ': ' + this.dateDiffInDays(notes[0].date, new Date()) + ' days');
              }
            });
        });
      });
      // .then(queryResults => {
      //   this.lastMonthsLowAttendence = [];
      //   queryResults.rows.forEach(studentStat => {
      //     const att = studentStat.value.sum / studentStat.value.count;

      //     let urgency = 'WARNING';
      //     if (att < AttendanceMonth.THRESHOLD_URGENT) {
      //       urgency = 'URGENT';
      //     }

      //     if (att < this.ATTENDANCE_THRESHOLD) {
      //       this.childrenService.getChild(studentStat.key)
      //         .subscribe(child => this.lastMonthsLowAttendence.push([child, att, urgency]));
      //     }
      //   });
      //   this.lastMonthsLowAttendence.sort((a, b) => a[1] - b[1]);
      // });
  }

  dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  }

  loadAttendanceOfAbsentees(daysOffset = 0) {
    this.attendanceRecordsMap = new Map();

    const today = new Date();
    const previousMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 6 + daysOffset);
    const previousSaturday = new Date(previousMonday.getFullYear(), previousMonday.getMonth(), previousMonday.getDate() + 5);

    const o1 = this.childrenService.getAttendancesOfMonth(previousMonday);
    o1.subscribe(attendances => {
      attendances.forEach(a => this.extractRelevantAttendanceDays(a, previousMonday, previousSaturday));
    });
    let o2 = o1;
    if (previousMonday.getMonth() !== previousSaturday.getMonth()) {
      o2 = this.childrenService.getAttendancesOfMonth(previousSaturday);
      o2.subscribe(attendances => attendances.forEach(a => this.extractRelevantAttendanceDays(a, previousMonday, previousSaturday)));
    }
    forkJoin(o1, o2).subscribe(() => this.filterAbsentees());
  }


  private extractRelevantAttendanceDays(attendanceMonth: AttendanceMonth, startDate: Date, endDate: Date) {
    let record = this.attendanceRecordsMap.get(attendanceMonth.student);
    if (record === undefined) {
      record = { childId: attendanceMonth.student, child: undefined, attendanceCoaching: [], attendanceSchool: [] };
      this.childrenService.getChild(attendanceMonth.student).subscribe(child => record.child = child);
      this.attendanceRecordsMap.set(attendanceMonth.student, record);
    }

    const relevantDays = attendanceMonth.dailyRegister
      .filter(a => a.date.getTime() >= startDate.getTime() && a.date.getTime() <= endDate.getTime());

    if (attendanceMonth.institution === 'coaching') {
      record.attendanceCoaching = record.attendanceCoaching.concat(relevantDays)
        .sort((a, b) => (a.date ? a.date.getTime() : 0) - (b.date ? b.date.getTime() : 0) );
    } else if (attendanceMonth.institution === 'school') {
      record.attendanceSchool = record.attendanceSchool.concat(relevantDays)
        .sort((a, b) => (a.date ? a.date.getTime() : 0) - (b.date ? b.date.getTime() : 0) );
    }
  }

  private filterAbsentees() {
    this.attendanceRecords = [];

    this.attendanceRecordsMap.forEach((record) => {
      const countAbsencesFun = (acc, v) => ((v.status === AttendanceStatus.ABSENT) ? acc + 1 : acc);
      record.schoolAbsences = record.attendanceSchool.reduce(countAbsencesFun, 0);
      record.coachingAbsences = record.attendanceCoaching.reduce(countAbsencesFun, 0);
      if (record.schoolAbsences > 1 || record.coachingAbsences > 1) {
        this.attendanceRecords.push(record);
      }
    });
  }


  goToChild(childId: string) {
    this.router.navigate(['/child', childId]);
  }
}
