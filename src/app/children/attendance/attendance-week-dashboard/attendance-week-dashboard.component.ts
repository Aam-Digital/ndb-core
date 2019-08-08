import {Component, Input, OnInit} from '@angular/core';
import {ChildrenService} from '../../children.service';
import {Router} from '@angular/router';
import {AttendanceMonth} from '../attendance-month';
import {AttendanceDay, AttendanceStatus} from '../attendance-day';
import {Child} from '../../child';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-attendance-week-dashboard',
  templateUrl: './attendance-week-dashboard.component.html',
  styleUrls: ['./attendance-week-dashboard.component.scss']
})
export class AttendanceWeekDashboardComponent implements OnInit {

  @Input() daysOffset: number;
  @Input() periodLabel: string;

  attendanceRecordsMap: Map<string,
    { childId: string, child: Child, attendanceSchool: AttendanceDay[], attendanceCoaching: AttendanceDay[],
      schoolAbsences?: number, coachingAbsences?: number}>;
  attendanceRecords;


  constructor(private childrenService: ChildrenService,
              private router: Router) { }

  ngOnInit() {
    this.loadAttendanceOfAbsentees(this.daysOffset);
  }

  recordTrackByFunction = (index, item) => item.childId;



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
