import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AttendanceMonth} from '../attendance-month';
import {Child} from '../../child';
import {ChildrenService} from '../../children.service';
import {MatSnackBar, MatTableDataSource} from '@angular/material';

@Component({
  selector: 'app-child-attendance',
  templateUrl: './child-attendance.component.html',
  styleUrls: ['./child-attendance.component.scss']
})
export class ChildAttendanceComponent implements OnInit {
  attendanceRecords: Array<AttendanceMonth>;
  attendanceDataSource = new MatTableDataSource();
  recordsEditing = new Map<string, boolean>();
  child: Child;

  columnsToDisplay = ['month', 'attended', 'working', 'percent', 'excused', 'remarks', 'actions'];

  constructor(private route: ActivatedRoute,
              private childrenService: ChildrenService,
              private snackBar: MatSnackBar) {
  }

  ngOnInit() {
    const params = this.route.snapshot.params;
    const childId = params['id'];

    this.childrenService.getChild(childId)
      .subscribe(result => this.child = result);

    this.childrenService.getAttendancesOfChild(childId)
      .subscribe(results => {
        this.attendanceRecords = results;
        this.attendanceDataSource.data = this.attendanceRecords;
      });
  }


  saveAttendanceMonth(att: AttendanceMonth) {
    // update in database
    this.childrenService.saveAttendance(att);

    this.recordsEditing.set(att.getId(), false);
  }

  resetAttendanceMonthChanges(att: AttendanceMonth) {
    // reload original record from database
    this.childrenService.getAttendance(att.getId())
      .subscribe(
      originalAtt => {
          const index = this.attendanceRecords.findIndex(a => a.getId() === att.getId());
          if (index > -1) {
            this.attendanceRecords[index] = originalAtt;
            this.attendanceDataSource.data = this.attendanceRecords;
          }
        },
        err => {
          if (err.status === 404) {
            this.removeFromDataTable(att);
          }
        }
      );
    this.recordsEditing.set(att.getId(), false);
  }

  private removeFromDataTable(att: AttendanceMonth) {
    const index = this.attendanceRecords.findIndex(a => a.getId() === att.getId());
    if (index > -1) {
      this.attendanceRecords.splice(index, 1);
      this.attendanceDataSource.data = this.attendanceRecords;
    }
  }

  deleteAttendanceMonth(att: AttendanceMonth) {
    // delete from database
    this.childrenService.removeAttendance(att);

    this.removeFromDataTable(att);

    const snackBarRef = this.snackBar.open('Attendance record deleted', 'Undo', { duration: 8000 });
    snackBarRef.onAction().subscribe(() => {
      this.saveAttendanceMonth(att);
      this.attendanceRecords.unshift(att);
      this.attendanceDataSource.data = this.attendanceRecords;
    });
  }

  newAttendanceMonth() {
    const att = new AttendanceMonth(Date.now().toString()); // TODO: logical way to assign entityId to Attendance?
    att.month = new Date();
    att.student = this.child.getId();
    this.recordsEditing.set(att.getId(), true);

    this.attendanceRecords.unshift(att);
    this.attendanceDataSource.data = this.attendanceRecords;
  }

}
